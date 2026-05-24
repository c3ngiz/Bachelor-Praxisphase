"""End-to-end collaboration scenario executed by the bot runner.

The scenario covers the full required flow: deterministic account bootstrap,
workspace and document setup, sharing, two authenticated WebSocket sessions,
presence/cursor checks, sequential and concurrent plain-text edits, convergence
hash checks, and server/client metrics reporting.
"""

from __future__ import annotations

import asyncio
import time
from datetime import datetime, timezone
from typing import Any, Awaitable, Callable, TypeVar
from uuid import uuid4

from tools.bots.config import BotConfig
from tools.bots.models import (
    AuthenticatedBot,
    ScenarioReport,
    WorkspaceArtifacts,
)
from tools.bots.rest_client import BotApiError, RestClient
from tools.bots.text_ot import TextOperation
from tools.bots.ws_client import CollaborationWsClient


T = TypeVar("T")


class CollaborationBotScenario:
    """Coordinates the two-bot end-to-end collaboration verification flow."""

    def __init__(self, config: BotConfig) -> None:
        self.config = config
        self.report = ScenarioReport()
        self.owner_ws: CollaborationWsClient | None = None
        self.collaborator_ws: CollaborationWsClient | None = None

    async def run(self) -> ScenarioReport:
        """Execute the scenario and return a structured report."""

        try:
            async with RestClient(self.config) as rest:
                owner = await self._step(
                    "owner auth",
                    lambda: self._authenticate(rest, self.config.owner_account, "owner"),
                )
                collaborator = await self._step(
                    "collaborator auth",
                    lambda: self._authenticate(
                        rest,
                        self.config.collaborator_account,
                        "collaborator",
                    ),
                )
                artifacts = await self._step(
                    "workspace setup",
                    lambda: self._setup_workspace(rest, owner),
                )
                await self._step(
                    "document sharing",
                    lambda: self._share_document(rest, owner, collaborator, artifacts.document_id),
                )
                await self._step(
                    "websocket collaboration",
                    lambda: self._run_websocket_checks(owner, collaborator, artifacts.document_id),
                )
                await self._step(
                    "divergence and metrics",
                    lambda: self._verify_divergence_and_metrics(rest, owner, artifacts.document_id),
                )

            self.report.finish(passed=True)
        except Exception as error:
            self.report.finish(passed=False, error=str(error))
        finally:
            await self._close_sockets()

        return self.report

    async def _step(self, name: str, callback: Callable[[], Awaitable[T]]) -> T:
        """Run one required step, record its result, and fail fast on errors."""

        try:
            result = await callback()
        except Exception as error:
            self.report.add_check(name, False, str(error))
            raise

        self.report.add_check(name, True)
        if self.config.verbose:
            print(f"[PASS] {name}")
        return result

    async def _authenticate(
        self,
        rest: RestClient,
        account: Any,
        role: str,
    ) -> AuthenticatedBot:
        """Sign up or sign in one bot and verify ``/auth/me``."""

        bot = await rest.sign_up_or_sign_in(account)
        me = await rest.me(bot.token)
        user = me.get("user", {})
        ensure(str(user.get("id")) == bot.user_id, f"{role} /auth/me returned wrong user id")
        ensure(str(user.get("email")) == bot.email, f"{role} /auth/me returned wrong email")
        self.report.auth[role] = bot.to_report()
        return bot

    async def _setup_workspace(
        self,
        rest: RestClient,
        owner: AuthenticatedBot,
    ) -> WorkspaceArtifacts:
        """Create a unique folder and document, then verify listing and loading."""

        suffix = f"{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}-{uuid4().hex[:8]}"
        folder_name = f"Bot Test Folder {suffix}"
        document_name = f"Bot Collaboration Test {suffix}"
        folder = (await rest.create_folder(owner.token, folder_name))["item"]
        document = (await rest.create_document(owner.token, document_name, folder["id"]))["item"]
        listing = await rest.list_items(owner.token, parent_id=folder["id"])
        items = listing.get("workspace", {}).get("items", [])
        ensure(any(item.get("id") == document["id"] for item in items), "document not in folder listing")
        loaded = await rest.get_document_content(owner.token, document["id"])
        ensure(loaded.get("documentId", loaded.get("document_id")) == document["id"], "document load id mismatch")
        ensure(bool(loaded.get("canWrite", loaded.get("can_write"))), "owner cannot write created document")
        artifacts = WorkspaceArtifacts(
            folder_id=str(folder["id"]),
            folder_name=folder_name,
            document_id=str(document["id"]),
            document_name=document_name,
        )
        self.report.workspace = artifacts.to_report()
        return artifacts

    async def _share_document(
        self,
        rest: RestClient,
        owner: AuthenticatedBot,
        collaborator: AuthenticatedBot,
        document_id: str,
    ) -> None:
        """Share the owner document with write access and verify collaborator state."""

        duplicate_share = False
        try:
            await rest.share_item(owner.token, document_id, collaborator.email, "write")
        except BotApiError as error:
            if error.code != "COLLABORATOR_ALREADY_EXISTS":
                raise
            duplicate_share = True

        collaborators = (await rest.list_collaborators(owner.token, document_id))["collaborators"]
        collaborator_entry = next(
            (item for item in collaborators if item.get("email") == collaborator.email),
            None,
        )
        ensure(collaborator_entry is not None, "collaborator not returned by collaborator list")
        ensure(
            collaborator_entry.get("permission") == "write",
            "collaborator does not have write permission",
        )
        loaded = await rest.get_document_content(collaborator.token, document_id)
        ensure(bool(loaded.get("canWrite", loaded.get("can_write"))), "collaborator cannot write")
        document = loaded.get("document", {})
        ensure(
            document.get("permission") == "write" or document.get("currentUserRole") == "write",
            "collaborator document permission is not write",
        )
        self.report.sharing = {
            "documentId": document_id,
            "collaboratorEmail": collaborator.email,
            "permission": "write",
            "duplicateShareHandled": duplicate_share,
        }

    async def _run_websocket_checks(
        self,
        owner: AuthenticatedBot,
        collaborator: AuthenticatedBot,
        document_id: str,
    ) -> None:
        """Connect both bots and run presence, cursor, edit, conflict, and version tests."""

        self.owner_ws = CollaborationWsClient(
            config=self.config,
            bot=owner,
            role="owner",
            document_id=document_id,
        )
        self.collaborator_ws = CollaborationWsClient(
            config=self.config,
            bot=collaborator,
            role="collaborator",
            document_id=document_id,
        )

        await self.owner_ws.connect()
        await self.collaborator_ws.connect()
        ensure(self.owner_ws.snapshot_received, "owner did not receive snapshot")
        ensure(self.collaborator_ws.snapshot_received, "collaborator did not receive snapshot")
        ensure(self.owner_ws.can_write and self.collaborator_ws.can_write, "both bots need write access")
        self.report.websocket = {
            "ownerClientId": self.owner_ws.client_id,
            "collaboratorClientId": self.collaborator_ws.client_id,
            "documentId": document_id,
            "connected": True,
        }

        await self._presence_check()
        await self._cursor_check()
        await self._simple_insert_check()
        await self._simple_delete_check()
        await self._concurrent_insert_check()
        await self._insert_delete_conflict_check()
        await self._overlapping_delete_check()
        await self._version_check()

    async def _presence_check(self) -> None:
        """Verify both bots see each other in room presence broadcasts."""

        owner, collaborator = self._clients()
        await asyncio.gather(
            owner.wait_for_peer_presence(collaborator.client_id),
            collaborator.wait_for_peer_presence(owner.client_id),
        )
        await asyncio.gather(owner.send_presence("idle"), collaborator.send_presence("active"))
        await asyncio.gather(
            owner.wait_for_peer_presence(collaborator.client_id),
            collaborator.wait_for_peer_presence(owner.client_id),
        )
        self.report.add_check("presence", True, "both bots saw each other")

    async def _cursor_check(self) -> None:
        """Verify bidirectional cursor delivery and valid cursor coordinates."""

        owner, collaborator = self._clients()
        await owner.send_cursor(pos=0, selection_start=0, selection_end=0)
        await collaborator.wait_for_cursor(owner.client_id)
        await collaborator.send_cursor(pos=0, selection_start=0, selection_end=0)
        await owner.wait_for_cursor(collaborator.client_id)
        ensure(owner.remote_cursor_positions_are_valid(), "owner saw invalid remote cursor")
        ensure(collaborator.remote_cursor_positions_are_valid(), "collaborator saw invalid remote cursor")
        self.report.add_check("cursor/selection", True, "cursor states delivered both ways")

    async def _simple_insert_check(self) -> None:
        """Verify one insert ack, broadcast, and convergence."""

        owner, _collaborator = self._clients()
        await self._single_operation(
            owner,
            {"type": "insert", "pos": len(owner.content), "text": "Hello from Bot A.\n"},
            "simple insert",
        )
        ensure("Hello from " in owner.content, "inserted text not present")

    async def _simple_delete_check(self) -> None:
        """Verify one delete ack, broadcast, and convergence."""

        owner, _collaborator = self._clients()
        pos = owner.content.index("from ")
        await self._single_operation(owner, {"type": "delete", "pos": pos, "len": 5}, "simple delete")
        ensure("Hello Bot A." in owner.content, "delete did not remove expected text")

    async def _concurrent_insert_check(self) -> None:
        """Verify deterministic convergence for same-position concurrent inserts."""

        owner, collaborator = self._clients()
        base_version = owner.version
        pos = 0
        await self._concurrent_operations(
            {"type": "insert", "pos": pos, "text": "[owner-concurrent]"},
            {"type": "insert", "pos": pos, "text": "[collab-concurrent]"},
            base_version=base_version,
            label="concurrent inserts",
        )
        ensure("[owner-concurrent]" in owner.content, "owner concurrent insert missing")
        ensure("[collab-concurrent]" in owner.content, "collaborator concurrent insert missing")

    async def _insert_delete_conflict_check(self) -> None:
        """Verify convergence when an insert and delete target nearby text."""

        owner, _collaborator = self._clients()
        marker = "\n[conflict:abcdefgh]"
        await self._single_operation(
            owner,
            {"type": "insert", "pos": len(owner.content), "text": marker},
            "conflict fixture insert",
        )
        start = owner.content.index("abcdefgh")
        await self._concurrent_operations(
            {"type": "insert", "pos": start + 2, "text": "X"},
            {"type": "delete", "pos": start + 1, "len": 4},
            base_version=owner.version,
            label="insert/delete conflict",
        )

    async def _overlapping_delete_check(self) -> None:
        """Verify overlapping concurrent deletes converge without invalid operations."""

        owner, _collaborator = self._clients()
        marker = "\n[overlap:0123456789]"
        await self._single_operation(
            owner,
            {"type": "insert", "pos": len(owner.content), "text": marker},
            "overlap fixture insert",
        )
        start = owner.content.index("0123456789")
        await self._concurrent_operations(
            {"type": "delete", "pos": start + 1, "len": 4},
            {"type": "delete", "pos": start + 3, "len": 4},
            base_version=owner.version,
            label="overlapping deletes",
        )

    async def _version_check(self) -> None:
        """Verify monotonically increasing versions and no invalid server operations."""

        owner, collaborator = self._clients()
        for client in (owner, collaborator):
            ensure(
                client.version_history == sorted(client.version_history),
                f"{client.role} versions were not monotonic",
            )
            ensure(not client.invalid_operations, f"{client.role} saw invalid server operations")
        ensure(owner.version == collaborator.version, "bot versions differ after collaboration")
        self.report.add_check("version handling", True, f"final version {owner.version}")

    async def _single_operation(
        self,
        client: CollaborationWsClient,
        op: TextOperation,
        label: str,
    ) -> None:
        """Send one operation, wait for ack/remote delivery, and assert convergence."""

        owner, collaborator = self._clients()
        started = time.perf_counter()
        op_id = await client.send_operation(op)
        ack = await client.wait_for_ack(op_id)
        target_version = int(ack.get("server_version", ack.get("serverVersion", 0)))
        await asyncio.gather(owner.wait_for_version(target_version), collaborator.wait_for_version(target_version))
        self._record_convergence(started)
        self._assert_converged(label)
        self.report.add_check(label, True, f"server version {target_version}")

    async def _concurrent_operations(
        self,
        owner_op: TextOperation,
        collaborator_op: TextOperation,
        *,
        base_version: int,
        label: str,
    ) -> None:
        """Send two operations with the same base version and verify convergence."""

        owner, collaborator = self._clients()
        started = time.perf_counter()
        owner_op_id, collaborator_op_id = await asyncio.gather(
            owner.send_operation(owner_op, base_version=base_version),
            collaborator.send_operation(collaborator_op, base_version=base_version),
        )
        owner_ack, collaborator_ack = await asyncio.gather(
            owner.wait_for_ack(owner_op_id),
            collaborator.wait_for_ack(collaborator_op_id),
        )
        target_version = max(
            int(owner_ack.get("server_version", owner_ack.get("serverVersion", 0))),
            int(collaborator_ack.get("server_version", collaborator_ack.get("serverVersion", 0))),
        )
        await asyncio.gather(owner.wait_for_version(target_version), collaborator.wait_for_version(target_version))
        self._record_convergence(started)
        self._assert_converged(label)
        self.report.add_check(label, True, f"server version {target_version}")

    def _assert_converged(self, label: str) -> None:
        """Assert both bot text models and hashes match after a scenario."""

        owner, collaborator = self._clients()
        ensure(owner.content == collaborator.content, f"{label}: bot contents diverged")
        ensure(owner.stable_hash() == collaborator.stable_hash(), f"{label}: bot hashes diverged")
        ensure(owner.remote_cursor_positions_are_valid(), f"{label}: owner cursor positions invalid")
        ensure(
            collaborator.remote_cursor_positions_are_valid(),
            f"{label}: collaborator cursor positions invalid",
        )

    async def _verify_divergence_and_metrics(
        self,
        rest: RestClient,
        owner: AuthenticatedBot,
        document_id: str,
    ) -> None:
        """Compare final bot hash with the backend and collect metrics."""

        owner_ws, collaborator_ws = self._clients()
        final_hash = owner_ws.stable_hash()
        snapshot = await rest.get_collaboration_snapshot(owner.token, document_id)
        ensure(snapshot.get("content") == owner_ws.content, "server snapshot content differs")
        ensure(int(snapshot.get("version", 0)) == owner_ws.version, "server snapshot version differs")
        hash_check = await rest.check_hash(owner.token, document_id, owner_ws.version, final_hash)
        ensure(bool(hash_check.get("inSync", hash_check.get("in_sync"))), "backend hash check failed")
        metrics = await rest.get_metrics(owner.token, document_id)
        total_ops = int(metrics.get("totalOperationsSent", metrics.get("total_operations_sent", 0)))
        acked_ops = int(metrics.get("acknowledgedOperations", metrics.get("acknowledged_operations", 0)))
        remote_ops = int(metrics.get("remoteOperationsReceived", metrics.get("remote_operations_received", 0)))
        sent_by_bots = owner_ws.metrics.operations_sent + collaborator_ws.metrics.operations_sent
        ensure(total_ops >= sent_by_bots, "server operation count did not update")
        ensure(acked_ops >= sent_by_bots, "server acknowledgement count did not update")
        ensure(remote_ops >= sent_by_bots, "server remote-delivery count did not update")

        self.report.final_content = owner_ws.content
        self.report.final_hash = final_hash
        self.report.server_metrics = metrics
        self.report.client_metrics = {
            "owner": owner_ws.metrics.to_report(),
            "collaborator": collaborator_ws.metrics.to_report(),
        }
        self.report.add_check("divergence detection", True, final_hash)
        self.report.add_check("metrics", True, f"{total_ops} server operations")

    def _record_convergence(self, started: float) -> None:
        """Record convergence timing on both clients for client-side metrics."""

        elapsed_ms = (time.perf_counter() - started) * 1000
        owner, collaborator = self._clients()
        owner.metrics.convergence_latencies_ms.append(elapsed_ms)
        collaborator.metrics.convergence_latencies_ms.append(elapsed_ms)

    def _clients(self) -> tuple[CollaborationWsClient, CollaborationWsClient]:
        """Return connected owner/collaborator WebSocket clients."""

        if self.owner_ws is None or self.collaborator_ws is None:
            raise RuntimeError("WebSocket clients are not connected")

        return self.owner_ws, self.collaborator_ws

    async def _close_sockets(self) -> None:
        """Close any sockets opened before a scenario failure."""

        await asyncio.gather(
            *(client.close() for client in (self.owner_ws, self.collaborator_ws) if client),
            return_exceptions=True,
        )


def ensure(condition: bool, message: str) -> None:
    """Raise an assertion error with a clear bot-check message."""

    if not condition:
        raise AssertionError(message)
