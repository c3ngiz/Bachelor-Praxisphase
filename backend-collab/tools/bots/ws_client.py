"""WebSocket collaboration client used by automated bots.

Each client joins one document room, receives the initial snapshot, sends
presence/cursor/operation messages, records acknowledgements, buffers
out-of-order server-version events, and applies only finalized operations from
the server. This mirrors the project protocol without changing the backend.
"""

from __future__ import annotations

import asyncio
import contextlib
import json
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Callable
from urllib.parse import urlencode, urlsplit, urlunsplit
from uuid import uuid4

import websockets
from websockets.exceptions import ConnectionClosed

from tools.bots.config import BotConfig
from tools.bots.models import AuthenticatedBot, ClientMetrics, JsonObject
from tools.bots.text_ot import (
    TextOperation,
    apply_operation,
    content_hash,
    cursor_positions_valid,
    is_operation_in_bounds,
)


@dataclass
class PendingOperation:
    """Operation sent by a bot while waiting for the matching acknowledgement."""

    op_id: str
    base_version: int
    sent_at: float


class CollaborationWsClient:
    """Stateful WebSocket bot for one authenticated user and document."""

    def __init__(
        self,
        *,
        config: BotConfig,
        bot: AuthenticatedBot,
        role: str,
        document_id: str,
    ) -> None:
        self.config = config
        self.bot = bot
        self.role = role
        self.document_id = document_id
        self.client_id = f"bot-{role}-{uuid4()}"
        self.url = build_document_ws_url(config.ws_base_url, document_id, bot.token)
        self.websocket: Any | None = None
        self.receiver_task: asyncio.Task[None] | None = None
        self.condition = asyncio.Condition()
        self.content = ""
        self.version = 0
        self.can_write = False
        self.snapshot_received = False
        self.presence: dict[str, JsonObject] = {}
        self.cursors: dict[str, JsonObject] = {}
        self.acks: dict[str, JsonObject] = {}
        self.remote_operations: dict[str, JsonObject] = {}
        self.messages: list[JsonObject] = []
        self.version_history: list[int] = []
        self.invalid_operations: list[JsonObject] = []
        self.pending: dict[str, PendingOperation] = {}
        self.server_events: dict[int, JsonObject] = {}
        self.metrics = ClientMetrics()
        self.closed_error: str | None = None

    async def connect(self) -> None:
        """Open the socket, send the required join message, and wait for snapshot."""

        self.websocket = await websockets.connect(
            self.url,
            open_timeout=self.config.timeout_seconds,
            close_timeout=2,
        )
        await self._send({"type": "join", "client_id": self.client_id})
        self.receiver_task = asyncio.create_task(self._receive_loop())
        await self.wait_until(lambda: self.snapshot_received, "initial snapshot")

    async def close(self) -> None:
        """Close the socket and stop the receive loop."""

        if self.websocket is not None:
            await self.websocket.close()

        if self.receiver_task is not None:
            self.receiver_task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self.receiver_task

        self.websocket = None
        self.receiver_task = None

    async def send_presence(self, status: str = "active") -> None:
        """Send a presence status update to trigger a room presence broadcast."""

        await self._send(
            {
                "type": "presence",
                "client_id": self.client_id,
                "status": status,
                "ts": utc_now(),
            }
        )

    async def send_cursor(
        self,
        *,
        pos: int,
        selection_start: int | None = None,
        selection_end: int | None = None,
    ) -> None:
        """Send one cursor/selection state using the backend message schema."""

        selection_start = pos if selection_start is None else selection_start
        selection_end = pos if selection_end is None else selection_end
        await self._send(
            {
                "type": "cursor",
                "cursor": {
                    "user_id": self.bot.user_id,
                    "client_id": self.client_id,
                    "pos": max(0, min(pos, len(self.content))),
                    "selection_start": max(0, min(selection_start, len(self.content))),
                    "selection_end": max(0, min(selection_end, len(self.content))),
                    "color": "#2563eb" if self.role == "owner" else "#059669",
                    "display_name": self.bot.name,
                    "ts": utc_now(),
                },
            }
        )

    async def send_operation(
        self,
        op: TextOperation,
        *,
        base_version: int | None = None,
    ) -> str:
        """Send one plain-text operation and return its generated operation id."""

        if not self.can_write:
            raise RuntimeError(f"{self.role} bot does not have write access")

        op_id = str(uuid4())
        selected_base_version = self.version if base_version is None else base_version
        self.pending[op_id] = PendingOperation(
            op_id=op_id,
            base_version=selected_base_version,
            sent_at=time.perf_counter(),
        )
        self.metrics.operations_sent += 1
        await self._send(
            {
                "type": "op",
                "op_id": op_id,
                "client_id": self.client_id,
                "doc_id": self.document_id,
                "base_version": selected_base_version,
                "op": op,
                "client_ts": utc_now(),
                "client_hash": content_hash(self.content),
            }
        )
        return op_id

    async def wait_for_ack(self, op_id: str) -> JsonObject:
        """Wait until the server acknowledges a specific operation id."""

        await self.wait_until(lambda: op_id in self.acks, f"ack {op_id}")
        return self.acks[op_id]

    async def wait_for_peer_presence(self, client_id: str) -> JsonObject:
        """Wait until this bot sees another client in the presence list."""

        await self.wait_until(
            lambda: client_id in self.presence,
            f"presence for {client_id}",
        )
        return self.presence[client_id]

    async def wait_for_peer_absence(self, client_id: str) -> None:
        """Wait until this bot no longer sees another client in room presence."""

        await self.wait_until(
            lambda: client_id not in self.presence,
            f"presence removal for {client_id}",
        )

    async def wait_for_cursor(self, client_id: str) -> JsonObject:
        """Wait until this bot receives a cursor state for another client."""

        await self.wait_until(lambda: client_id in self.cursors, f"cursor for {client_id}")
        return self.cursors[client_id]

    async def wait_for_version(self, version: int) -> None:
        """Wait until this bot has applied all server events through a version."""

        await self.wait_until(lambda: self.version >= version, f"version {version}")

    async def wait_until(self, predicate: Callable[[], bool], description: str) -> None:
        """Wait for a state predicate while surfacing socket failures clearly."""

        deadline = time.monotonic() + self.config.timeout_seconds

        async with self.condition:
            while not predicate():
                if self.closed_error:
                    raise RuntimeError(f"{self.role} socket closed while waiting for {description}: "
                                       f"{self.closed_error}")

                remaining = deadline - time.monotonic()
                if remaining <= 0:
                    raise TimeoutError(f"Timed out waiting for {self.role} {description}")

                await asyncio.wait_for(self.condition.wait(), timeout=remaining)

    def stable_hash(self) -> str:
        """Return the current local content hash."""

        return content_hash(self.content)

    def remote_cursor_positions_are_valid(self) -> bool:
        """Return whether all known remote cursor offsets fit current content."""

        return all(cursor_positions_valid(self.content, cursor) for cursor in self.cursors.values())

    async def _receive_loop(self) -> None:
        """Receive and dispatch server messages until the socket closes."""

        try:
            assert self.websocket is not None
            async for raw_message in self.websocket:
                message = json.loads(raw_message)

                if not isinstance(message, dict):
                    continue

                async with self.condition:
                    self.messages.append(message)
                    self._handle_message(message)
                    self.condition.notify_all()
        except asyncio.CancelledError:
            raise
        except ConnectionClosed:
            pass
        except Exception as error:  # pragma: no cover - exercised in live harness failures.
            async with self.condition:
                self.closed_error = repr(error)
                self.condition.notify_all()

    def _handle_message(self, message: JsonObject) -> None:
        """Dispatch one server message according to the current protocol."""

        message_type = message.get("type")

        if message_type == "snapshot":
            self.content = str(message.get("content", ""))
            self.version = int(message.get("version", 0))
            self.can_write = bool(message.get("can_write", message.get("canWrite", False)))
            self.snapshot_received = True
            self.presence = _by_client_id(message.get("presence", []), exclude=self.client_id)
            self.version_history.append(self.version)
            return

        if message_type == "presence":
            self.presence = _by_client_id(message.get("users", []), exclude=self.client_id)
            for client_id in list(self.cursors):
                if client_id not in self.presence:
                    self.cursors.pop(client_id, None)
            return

        if message_type == "cursor":
            cursor = message.get("cursor", {})
            if isinstance(cursor, dict):
                client_id = str(cursor.get("client_id", cursor.get("clientId", "")))
                if client_id and client_id != self.client_id:
                    self.cursors[client_id] = cursor
            return

        if message_type == "ack":
            self._handle_ack(message)
            return

        if message_type == "broadcast_op":
            self.metrics.remote_operations_received += 1
            self.remote_operations[str(message.get("op_id", message.get("opId", "")))] = message
            self._record_server_operation(message, source="broadcast_op")
            return

        if message_type == "error":
            raise RuntimeError(f"WebSocket protocol error: {message}")

    def _handle_ack(self, message: JsonObject) -> None:
        """Record acknowledgement timing and apply accepted finalized operations."""

        op_id = str(message.get("op_id", message.get("opId", "")))
        pending = self.pending.pop(op_id, None)
        self.acks[op_id] = message
        self.metrics.acknowledgements_received += 1

        if pending:
            self.metrics.ack_latencies_ms.append((time.perf_counter() - pending.sent_at) * 1000)

        if _is_noop_ack(message, pending):
            return

        self._record_server_operation(message, source="ack")

    def _record_server_operation(self, message: JsonObject, *, source: str) -> None:
        """Buffer and apply a server-versioned operation in sequence order."""

        server_version = int(message.get("server_version", message.get("serverVersion", 0)))
        op = message.get("op")

        if not isinstance(op, dict) or server_version <= self.version:
            return

        existing = self.server_events.get(server_version)
        if existing and existing.get("source") == "broadcast_op" and source == "ack":
            return

        self.server_events[server_version] = {
            "source": source,
            "op": op,
            "op_id": str(message.get("op_id", message.get("opId", ""))),
        }
        self._drain_server_events()

    def _drain_server_events(self) -> None:
        """Apply buffered finalized operations whenever the next version is ready."""

        while self.version + 1 in self.server_events:
            next_version = self.version + 1
            event = self.server_events.pop(next_version)
            op = event["op"]

            if not is_operation_in_bounds(self.content, op):
                self.invalid_operations.append(
                    {"version": next_version, "op": op, "contentLength": len(self.content)}
                )

            self.content = apply_operation(self.content, op)
            self.version = next_version
            self.version_history.append(self.version)

    async def _send(self, payload: JsonObject) -> None:
        """Serialize and send a JSON WebSocket payload."""

        if self.websocket is None:
            raise RuntimeError(f"{self.role} socket is not connected")

        await self.websocket.send(json.dumps(payload))


def build_document_ws_url(base_url: str, document_id: str, token: str) -> str:
    """Build the authenticated WebSocket URL for a document collaboration room."""

    parsed = urlsplit(base_url.rstrip("/"))
    query = urlencode({"token": token})
    return urlunsplit(
        (
            parsed.scheme,
            parsed.netloc,
            f"/ws/docs/{document_id}",
            query,
            "",
        )
    )


def utc_now() -> str:
    """Return the timestamp format accepted by the WebSocket schemas."""

    return datetime.now(timezone.utc).isoformat()


def _by_client_id(items: object, *, exclude: str) -> dict[str, JsonObject]:
    """Index presence or cursor payloads by client id while excluding self."""

    if not isinstance(items, list):
        return {}

    indexed: dict[str, JsonObject] = {}

    for item in items:
        if not isinstance(item, dict):
            continue

        client_id = str(item.get("client_id", item.get("clientId", "")))
        if client_id and client_id != exclude:
            indexed[client_id] = item

    return indexed


def _is_noop_ack(message: JsonObject, pending: PendingOperation | None) -> bool:
    """Detect the backend's current no-version-increment acknowledgement shape."""

    if pending is None:
        return False

    transform_required = bool(
        message.get("transform_required", message.get("transformRequired", False))
    )
    server_version = int(message.get("server_version", message.get("serverVersion", 0)))
    return transform_required and server_version == pending.base_version + 1
