from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass
from typing import Any

from fastapi import WebSocket
from pydantic import TypeAdapter, ValidationError

from .config import Settings
from .models import (
    ClientMessage,
    ClientOpMessage,
    CursorState,
    DocumentSnapshot,
    UserSession,
    WorkspaceAccess,
    utc_now,
)
from .ot import OperationIdentity, apply_operation, transform_over_history
from .repository import CollaborationRepository

client_message_adapter = TypeAdapter(ClientMessage)


@dataclass
class ClientConnection:
    websocket: WebSocket
    user: UserSession
    access: WorkspaceAccess
    client_id: str
    cursor: CursorState | None = None
    status: str = "active"

    @property
    def key(self) -> str:
        return f"{self.user.user_id}:{self.client_id}"


class Room:
    def __init__(
        self,
        snapshot: DocumentSnapshot,
        repository: CollaborationRepository,
        settings: Settings,
    ) -> None:
        self.doc_id = snapshot.doc_id
        self.content = snapshot.content
        self.version = snapshot.version
        self.repository = repository
        self.settings = settings
        self.clients: dict[str, ClientConnection] = {}
        self.lock = asyncio.Lock()

    async def join(self, connection: ClientConnection) -> None:
        self.clients[connection.key] = connection
        await self.send(
            connection.websocket,
            {
                "type": "snapshot",
                "doc_id": self.doc_id,
                "content": self.content,
                "version": self.version,
                "can_write": connection.access.can_write,
                "presence": self.presence_payload(exclude_key=connection.key),
                "server_ts": utc_now().isoformat(),
            },
        )
        await self.broadcast_presence()

    async def leave(self, connection: ClientConnection | None) -> None:
        if not connection:
            return
        self.clients.pop(connection.key, None)
        await self.broadcast_presence()

    async def handle_message(self, connection: ClientConnection, raw: dict[str, Any]) -> None:
        try:
            message = client_message_adapter.validate_python(raw)
        except ValidationError as error:
            await self.send_error(connection.websocket, "INVALID_MESSAGE", str(error), True)
            return

        if message.type == "op":
            await self.handle_operation(connection, message)
        elif message.type == "cursor":
            await self.handle_cursor(connection, message.cursor)
        elif message.type == "presence":
            connection.status = message.status
            await self.broadcast_presence()
        elif message.type == "ping":
            await self.send(
                connection.websocket,
                {
                    "type": "pong",
                    "ping_id": message.ping_id,
                    "client_ts": message.client_ts.isoformat(),
                    "server_ts": utc_now().isoformat(),
                },
            )

    async def handle_operation(
        self, connection: ClientConnection, message: ClientOpMessage
    ) -> None:
        if not connection.access.can_write:
            await self.send_error(connection.websocket, "READ_ONLY", "Write access is required.", True)
            return

        if str(message.doc_id) != self.doc_id:
            await self.send_error(connection.websocket, "DOC_MISMATCH", "Operation doc_id mismatch.", False)
            return

        existing = await self.repository.operation_by_id(str(message.op_id))
        if existing:
            await self.send_ack(
                connection,
                str(message.op_id),
                existing.server_version,
                existing.op,
                transform_required=False,
            )
            return

        async with self.lock:
            raw_op = message.op.model_dump(mode="json")
            transformed_op = raw_op
            transform_required = message.base_version < self.version
            started_at = time.perf_counter()

            if transform_required:
                missed_operations = await self.repository.operations_since(
                    self.doc_id,
                    message.base_version,
                )
                history = [
                    (
                        accepted.op,
                        OperationIdentity(
                            client_id=accepted.client_id,
                            op_id=accepted.op_id,
                        ),
                    )
                    for accepted in missed_operations
                ]
                transformed_op = transform_over_history(
                    raw_op,
                    OperationIdentity(
                        client_id=message.client_id,
                        op_id=str(message.op_id),
                    ),
                    history,
                )

            transform_ms = (time.perf_counter() - started_at) * 1000

            if transformed_op is None:
                await self.send_ack(
                    connection,
                    str(message.op_id),
                    self.version,
                    raw_op,
                    transform_required=transform_required,
                )
                return

            next_content = apply_operation(self.content, transformed_op)
            next_version = self.version + 1
            await self.repository.persist_operation(
                doc_id=self.doc_id,
                user_id=connection.user.user_id,
                client_id=message.client_id,
                op_id=str(message.op_id),
                base_version=message.base_version,
                raw_op=raw_op,
                op=transformed_op,
                server_version=next_version,
                content=next_content,
                client_ts=message.client_ts,
                transform_required=transform_required,
                transform_ms=transform_ms,
            )
            self.content = next_content
            self.version = next_version

            if self.settings.snapshot_every_ops > 0 and next_version % self.settings.snapshot_every_ops == 0:
                await self.repository.persist_snapshot(self.doc_id, next_version, next_content)

        server_ts = utc_now().isoformat()
        await self.send_ack(
            connection,
            str(message.op_id),
            next_version,
            transformed_op,
            transform_required=transform_required,
            server_ts=server_ts,
        )
        await self.broadcast(
            {
                "type": "broadcast_op",
                "op_id": str(message.op_id),
                "client_id": message.client_id,
                "doc_id": self.doc_id,
                "server_version": next_version,
                "op": transformed_op,
                "client_ts": message.client_ts.isoformat(),
                "server_ts": server_ts,
            },
            exclude_key=connection.key,
        )
        await self.repository.record_metric(
            self.doc_id,
            "operation_accepted",
            {
                "server_version": next_version,
                "transform_required": transform_required,
                "transform_ms": transform_ms,
            },
        )

    async def handle_cursor(self, connection: ClientConnection, cursor: CursorState) -> None:
        connection.cursor = cursor
        await self.broadcast(
            {
                "type": "cursor",
                "cursor": cursor.model_dump(mode="json"),
            },
            exclude_key=connection.key,
        )

    async def send_ack(
        self,
        connection: ClientConnection,
        op_id: str,
        server_version: int,
        op: dict[str, Any],
        *,
        transform_required: bool,
        server_ts: str | None = None,
    ) -> None:
        await self.send(
            connection.websocket,
            {
                "type": "ack",
                "op_id": op_id,
                "server_version": server_version,
                "op": op,
                "transform_required": transform_required,
                "server_ts": server_ts or utc_now().isoformat(),
            },
        )

    async def broadcast_presence(self) -> None:
        await self.broadcast(
            {
                "type": "presence",
                "users": self.presence_payload(),
            }
        )

    def presence_payload(self, exclude_key: str | None = None) -> list[dict[str, Any]]:
        users: list[dict[str, Any]] = []

        for key, connection in self.clients.items():
            if key == exclude_key:
                continue

            cursor = connection.cursor or CursorState(
                user_id=connection.user.user_id,
                client_id=connection.client_id,
                pos=0,
                selection_start=0,
                selection_end=0,
                color=connection.user.avatar_color or "#2563eb",
                display_name=connection.user.name,
                ts=utc_now(),
            )
            users.append(cursor.model_dump(mode="json"))

        return users

    async def broadcast(
        self,
        payload: dict[str, Any],
        *,
        exclude_key: str | None = None,
    ) -> None:
        stale_keys: list[str] = []

        for key, connection in self.clients.items():
            if key == exclude_key:
                continue
            try:
                await self.send(connection.websocket, payload)
            except RuntimeError:
                stale_keys.append(key)

        for key in stale_keys:
            self.clients.pop(key, None)

    async def send(self, websocket: WebSocket, payload: dict[str, Any]) -> None:
        await websocket.send_json(payload)

    async def send_error(
        self,
        websocket: WebSocket,
        code: str,
        message: str,
        recoverable: bool,
    ) -> None:
        await self.send(
            websocket,
            {
                "type": "error",
                "code": code,
                "message": message,
                "recoverable": recoverable,
            },
        )


class RoomManager:
    def __init__(self, repository: CollaborationRepository, settings: Settings) -> None:
        self.repository = repository
        self.settings = settings
        self.rooms: dict[str, Room] = {}
        self.manager_lock = asyncio.Lock()

    async def get_room(self, doc_id: str) -> Room:
        async with self.manager_lock:
            existing = self.rooms.get(doc_id)
            if existing:
                return existing

            snapshot = await self.repository.get_or_create_document(doc_id)
            room = Room(snapshot, self.repository, self.settings)
            self.rooms[doc_id] = room
            return room
