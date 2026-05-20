"""WebSocket operational-transform collaboration service and room manager."""

from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass
from datetime import datetime
from typing import Any
from uuid import UUID

from fastapi import WebSocket
from pydantic import TypeAdapter, ValidationError
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.common.datetime import to_iso, utc_now
from app.core.config import Settings
from app.core.errors import UnauthorizedError
from app.core.security import SecurityService
from app.db.models.collaboration import (
    CollabDocument,
    CollabMetricEvent,
    CollabOperation,
    CollabSnapshot,
)
from app.db.models.document import DocumentContent
from app.db.models.workspace import WorkspaceItem
from app.domain.collaboration.cursor_transform import transform_cursor_state
from app.domain.collaboration.divergence import compare_document_hash, stable_text_hash
from app.domain.collaboration.metrics import (
    RoomMetrics,
    TransformCase,
    empty_transform_case_counts,
    transform_over_history_with_metrics,
)
from app.domain.collaboration.operations import OperationIdentity, apply_operation
from app.domain.collaboration.schemas import (
    AcceptedOperation,
    ClientMessage,
    ClientOpMessage,
    CollaborationHashCheckResponse,
    CollaborationMetricsResponse,
    CollaborationSnapshotResponse,
    CursorState,
    DocumentSnapshot,
    TransformCaseCounts,
    UserSession,
    WorkspaceAccess,
)
from app.domain.documents.events import document_content_events
from app.domain.documents.service import DocumentsService, extract_tiptap_text, plain_text_to_tiptap
from app.domain.users.service import UsersService
from app.domain.workspace.service import WorkspaceService

client_message_adapter = TypeAdapter(ClientMessage)


class CollaborationRepository:
    """SQLAlchemy persistence facade for collaboration state and permissions."""

    def __init__(self, session_factory: async_sessionmaker[AsyncSession]) -> None:
        self.session_factory = session_factory

    async def get_user(self, user_id: str) -> UserSession | None:
        """Load a user snapshot for WebSocket authentication."""

        async with self.session_factory() as db:
            user = await UsersService(db).find_by_id(user_id)

            if not user:
                return None

            return UserSession(
                user_id=str(user.id),
                email=user.email,
                name=user.name,
                avatar_color=user.avatar_color,
            )

    async def resolve_workspace_access(self, user_id: str, doc_id: str) -> WorkspaceAccess | None:
        """Resolve document access using the same folder inheritance rules as REST."""

        async with self.session_factory() as db:
            service = WorkspaceService(db)

            try:
                item = await service.get_accessible_record(user_id, doc_id)
                service.assert_document(item)
                access = await service.resolve_access_or_throw(user_id, item)
            except Exception:
                return None

            return WorkspaceAccess(doc_id=str(item.id), title=item.name, permission=access.permission)

    async def get_or_create_document(self, doc_id: str) -> DocumentSnapshot:
        """Load or create the plain-text collaboration document for a workspace doc."""

        doc_uuid = UUID(doc_id)

        async with self.session_factory() as db:
            result = await db.execute(
                select(CollabDocument).where(CollabDocument.doc_id == doc_uuid)
            )
            existing = result.scalar_one_or_none()

            if existing:
                return self.snapshot_from_model(existing)

            content_result = await db.execute(
                select(DocumentContent.content).where(DocumentContent.item_id == doc_uuid)
            )
            initial_content = extract_tiptap_text(content_result.scalar_one_or_none() or {})
            document = CollabDocument(doc_id=doc_uuid, content=initial_content, version=0)
            db.add(document)
            await db.commit()
            await db.refresh(document)
            return self.snapshot_from_model(document)

    async def operations_since(self, doc_id: str, base_version: int) -> list[AcceptedOperation]:
        """Load operations accepted after a client base version."""

        async with self.session_factory() as db:
            result = await db.execute(
                select(CollabOperation)
                .where(
                    CollabOperation.doc_id == UUID(doc_id),
                    CollabOperation.server_version > base_version,
                )
                .order_by(CollabOperation.server_version.asc())
            )
            return [operation_from_model(row) for row in result.scalars().all()]

    async def operation_by_id(self, op_id: str) -> AcceptedOperation | None:
        """Return a previously accepted operation for idempotent retry handling."""

        async with self.session_factory() as db:
            result = await db.execute(
                select(CollabOperation).where(CollabOperation.op_id == UUID(op_id))
            )
            operation = result.scalar_one_or_none()
            return operation_from_model(operation) if operation else None

    async def persist_operation(
        self,
        *,
        doc_id: str,
        user_id: str,
        client_id: str,
        op_id: str,
        base_version: int,
        raw_op: dict[str, Any],
        op: dict[str, Any],
        server_version: int,
        content: str,
        client_ts,
        transform_required: bool,
        transform_ms: float,
    ) -> None:
        """Persist an accepted operation and update all document revision metadata."""

        doc_uuid = UUID(doc_id)
        now = utc_now()

        async with self.session_factory() as db:
            async with db.begin():
                document = await db.get(CollabDocument, doc_uuid)

                if not document:
                    document = CollabDocument(doc_id=doc_uuid, content="", version=0)
                    db.add(document)
                    await db.flush()

                document.content = content
                document.version = server_version
                document.updated_at = now
                db.add(
                    CollabOperation(
                        op_id=UUID(op_id),
                        doc_id=doc_uuid,
                        user_id=UUID(user_id),
                        client_id=client_id,
                        base_version=base_version,
                        raw_op=raw_op,
                        op=op,
                        server_version=server_version,
                        client_ts=client_ts,
                        transform_required=transform_required,
                        transform_ms=transform_ms,
                    )
                )

                content_result = await db.execute(
                    select(DocumentContent).where(DocumentContent.item_id == doc_uuid)
                )
                document_content = content_result.scalar_one_or_none()
                json_content = plain_text_to_tiptap(content)

                if document_content:
                    document_content.content = json_content
                    document_content.revision += 1
                    document_content.updated_at = now
                else:
                    db.add(DocumentContent(item_id=doc_uuid, content=json_content, revision=1))

                item = await db.get(WorkspaceItem, doc_uuid)
                if item:
                    item.updated_at = now

        async with self.session_factory() as db:
            response = await DocumentsService(db).get_content(
                user_id, doc_id, touch_last_opened_at=False
            )
            await document_content_events.publish(doc_id, response)

    async def persist_snapshot(self, doc_id: str, version: int, content: str) -> None:
        """Persist a periodic collaboration snapshot."""

        async with self.session_factory() as db:
            db.add(CollabSnapshot(doc_id=UUID(doc_id), version=version, content=content))
            await db.commit()

    async def record_metric(self, doc_id: str, event_type: str, payload: dict[str, Any]) -> None:
        """Persist a collaboration diagnostic metric event."""

        async with self.session_factory() as db:
            db.add(CollabMetricEvent(doc_id=UUID(doc_id), event_type=event_type, payload=payload))
            await db.commit()

    async def metrics_summary(self) -> list[dict[str, Any]]:
        """Return per-document collaboration metrics for the `/metrics` endpoint."""

        async with self.session_factory() as db:
            result = await db.execute(
                select(
                    CollabDocument.doc_id,
                    CollabDocument.version,
                    func.length(CollabDocument.content).label("content_length"),
                    func.count(CollabOperation.op_id).label("operation_count"),
                    func.coalesce(
                        func.sum(case((CollabOperation.transform_required.is_(True), 1), else_=0)),
                        0,
                    ).label("transformed_operation_count"),
                    func.coalesce(func.avg(CollabOperation.transform_ms), 0).label("avg_transform_ms"),
                    func.max(CollabOperation.created_at).label("last_operation_at"),
                )
                .join(CollabOperation, CollabOperation.doc_id == CollabDocument.doc_id, isouter=True)
                .group_by(CollabDocument.doc_id, CollabDocument.version, CollabDocument.content)
                .order_by(func.max(CollabDocument.updated_at).desc())
            )
            rows = result.mappings().all()
            return [
                {
                    key: str(value) if isinstance(value, UUID) else value
                    for key, value in row.items()
                }
                for row in rows
            ]

    def snapshot_from_model(self, document: CollabDocument) -> DocumentSnapshot:
        """Map an ORM collaboration document into a WebSocket snapshot."""

        return document_snapshot_from_model(document)


class CollaborationQueryService:
    """Read-side collaboration service shared by REST and GraphQL APIs."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.workspace = WorkspaceService(db)

    async def get_snapshot(
        self,
        user_id: str,
        document_id: str,
    ) -> CollaborationSnapshotResponse:
        """Return the latest server-owned plain-text snapshot for one document."""

        access = await self.resolve_access(user_id, document_id)
        snapshot = await self.get_or_create_document_snapshot(user_id, document_id)
        return CollaborationSnapshotResponse(
            document_id=snapshot.doc_id,
            content=snapshot.content,
            version=snapshot.version,
            hash=stable_text_hash(snapshot.content),
            can_write=access.can_write,
            updated_at=to_iso(snapshot.updated_at) or "",
        )

    async def compare_hash(
        self,
        user_id: str,
        document_id: str,
        *,
        client_version: int,
        client_hash: str,
    ) -> CollaborationHashCheckResponse:
        """Compare a client hash with the current server text and record divergence."""

        await self.resolve_access(user_id, document_id)
        snapshot = await self.get_or_create_document_snapshot(user_id, document_id)
        comparison = compare_document_hash(
            document_id=document_id,
            server_content=snapshot.content,
            server_version=snapshot.version,
            client_version=client_version,
            client_hash=client_hash,
        )

        if not comparison.in_sync:
            self.db.add(
                CollabMetricEvent(
                    doc_id=UUID(document_id),
                    event_type="divergence_detected",
                    payload={
                        "client_version": comparison.client_version,
                        "server_version": comparison.version,
                        "client_hash": comparison.client_hash,
                        "server_hash": comparison.server_hash,
                        "version_matches": comparison.version_matches,
                        "hash_matches": comparison.hash_matches,
                    },
                )
            )
            await self.db.commit()

        return CollaborationHashCheckResponse(
            document_id=comparison.document_id,
            version=comparison.version,
            client_version=comparison.client_version,
            server_hash=comparison.server_hash,
            client_hash=comparison.client_hash,
            in_sync=comparison.in_sync,
            version_matches=comparison.version_matches,
            hash_matches=comparison.hash_matches,
            checked_at=utc_now().isoformat(),
        )

    async def get_metrics(
        self,
        user_id: str,
        document_id: str,
    ) -> CollaborationMetricsResponse:
        """Return persisted document-level metrics for an accessible document."""

        await self.resolve_access(user_id, document_id)
        snapshot = await self.get_or_create_document_snapshot(user_id, document_id)
        operations = await self.load_operations(document_id)
        events = await self.load_metric_events(document_id)
        case_counts = empty_transform_case_counts()
        server_processing_ms: list[float] = []
        ack_latency_ms: list[float] = []
        broadcast_deliveries = 0
        divergence_events = 0

        for event in events:
            if event.event_type == "divergence_detected":
                divergence_events += 1
                continue

            if event.event_type != "operation_accepted":
                continue

            payload = event.payload
            event_case_counts = payload.get("transform_case_counts", {})
            if isinstance(event_case_counts, dict):
                for case in case_counts:
                    case_counts[case] += int(event_case_counts.get(case, 0))

            broadcast_deliveries += int(payload.get("broadcast_recipient_count", 0) or 0)
            append_float(server_processing_ms, payload.get("server_processing_ms"))
            append_float(ack_latency_ms, payload.get("client_latency_ms"))

        last_operation = max((operation.created_at for operation in operations), default=None)
        avg_server_processing_ms = average(server_processing_ms)
        if avg_server_processing_ms is None:
            avg_server_processing_ms = average([operation.transform_ms for operation in operations])

        return CollaborationMetricsResponse(
            document_id=document_id,
            version=snapshot.version,
            content_length=len(snapshot.content),
            total_operations_sent=len(operations),
            acknowledged_operations=len(operations),
            remote_operations_received=broadcast_deliveries,
            transformed_operations=sum(1 for operation in operations if operation.transform_required),
            transform_case_counts=to_transform_case_counts(case_counts),
            avg_ack_latency_ms=average(ack_latency_ms),
            avg_server_processing_ms=avg_server_processing_ms,
            divergence_events=divergence_events,
            last_operation_at=to_iso(last_operation) if last_operation else None,
        )

    async def resolve_access(self, user_id: str, document_id: str) -> WorkspaceAccess:
        """Resolve and validate read access for a collaboration document."""

        item = await self.workspace.get_accessible_record(user_id, document_id)
        self.workspace.assert_document(item)
        access = await self.workspace.resolve_access_or_throw(user_id, item)
        return WorkspaceAccess(doc_id=str(item.id), title=item.name, permission=access.permission)

    async def get_or_create_document_snapshot(
        self,
        user_id: str,
        document_id: str,
    ) -> DocumentSnapshot:
        """Load or create the collaboration document without opening a WebSocket."""

        doc_uuid = UUID(document_id)
        result = await self.db.execute(
            select(CollabDocument).where(CollabDocument.doc_id == doc_uuid)
        )
        existing = result.scalar_one_or_none()

        if existing:
            return document_snapshot_from_model(existing)

        content_response = await DocumentsService(self.db).get_content(
            user_id,
            document_id,
            touch_last_opened_at=False,
        )
        document = CollabDocument(
            doc_id=doc_uuid,
            content=extract_tiptap_text(content_response.content),
            version=0,
        )
        self.db.add(document)
        await self.db.commit()
        await self.db.refresh(document)
        return document_snapshot_from_model(document)

    async def load_operations(self, document_id: str) -> list[CollabOperation]:
        """Load persisted operations for a document in server-version order."""

        result = await self.db.execute(
            select(CollabOperation)
            .where(CollabOperation.doc_id == UUID(document_id))
            .order_by(CollabOperation.server_version.asc())
        )
        return list(result.scalars().all())

    async def load_metric_events(self, document_id: str) -> list[CollabMetricEvent]:
        """Load persisted metric events for a document in creation order."""

        result = await self.db.execute(
            select(CollabMetricEvent)
            .where(CollabMetricEvent.doc_id == UUID(document_id))
            .order_by(CollabMetricEvent.created_at.asc())
        )
        return list(result.scalars().all())


class CollaborationAuthService:
    """Authenticates WebSocket clients using the shared JWT settings and users table."""

    def __init__(self, security: SecurityService, repository: CollaborationRepository) -> None:
        self.security = security
        self.repository = repository

    async def authenticate_websocket(self, websocket: WebSocket) -> UserSession:
        """Validate the `token` query parameter and return its user session."""

        token = websocket.query_params.get("token")

        if not token:
            raise UnauthorizedError("Authentication token is required.")

        payload = self.security.decode_access_token(token)
        user = await self.repository.get_user(payload["sub"])

        if not user:
            raise UnauthorizedError("Authentication token subject no longer exists.")

        return user


@dataclass
class ClientConnection:
    """In-memory representation of a connected collaboration client."""

    websocket: WebSocket
    user: UserSession
    access: WorkspaceAccess
    client_id: str
    cursor: CursorState | None = None
    status: str = "active"

    @property
    def key(self) -> str:
        """Return a stable in-room connection key."""

        return f"{self.user.user_id}:{self.client_id}"


class Room:
    """Single-document collaboration room with serialized operation acceptance."""

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
        self.metrics = RoomMetrics()

    async def join(self, connection: ClientConnection) -> None:
        """Add a client and send the current document snapshot."""

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
        """Remove a client and broadcast the updated presence list."""

        if not connection:
            return
        self.clients.pop(connection.key, None)
        await self.broadcast_presence()

    async def handle_message(self, connection: ClientConnection, raw: dict[str, Any]) -> None:
        """Validate and dispatch one client WebSocket message."""

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

    async def handle_operation(self, connection: ClientConnection, message: ClientOpMessage) -> None:
        """Transform, persist, acknowledge, and broadcast a client operation."""

        if not connection.access.can_write:
            await self.send_error(connection.websocket, "READ_ONLY", "Write access is required.", True)
            return

        if str(message.doc_id) != self.doc_id:
            await self.send_error(connection.websocket, "DOC_MISMATCH", "Operation doc_id mismatch.", False)
            return

        self.metrics.record_operation_sent()
        processing_started_at = time.perf_counter()
        existing = await self.repository.operation_by_id(str(message.op_id))
        if existing:
            await self.send_ack(
                connection,
                str(message.op_id),
                existing.server_version,
                existing.op,
                transform_required=False,
                server_processing_ms=(time.perf_counter() - processing_started_at) * 1000,
                transform_case_counts=empty_transform_case_counts(),
            )
            return

        transform_case_counts = empty_transform_case_counts()
        async with self.lock:
            raw_op = message.op.model_dump(mode="json")
            transformed_op: dict[str, Any] | None = raw_op
            transform_required = message.base_version < self.version
            started_at = time.perf_counter()

            if transform_required:
                missed_operations = await self.repository.operations_since(
                    self.doc_id, message.base_version
                )
                history = [
                    (
                        accepted.op,
                        OperationIdentity(client_id=accepted.client_id, op_id=accepted.op_id),
                    )
                    for accepted in missed_operations
                ]
                transform_result = transform_over_history_with_metrics(
                    raw_op,
                    OperationIdentity(client_id=message.client_id, op_id=str(message.op_id)),
                    history,
                )
                transformed_op = transform_result.op
                transform_case_counts = transform_result.metrics.case_counts

            transform_ms = (time.perf_counter() - started_at) * 1000

            if transformed_op is None:
                server_processing_ms = (time.perf_counter() - processing_started_at) * 1000
                self.metrics.record_transform(
                    transform_required=transform_required,
                    case_counts=transform_case_counts,
                    server_processing_ms=server_processing_ms,
                )
                await self.send_ack(
                    connection,
                    str(message.op_id),
                    self.version,
                    raw_op,
                    transform_required=transform_required,
                    server_processing_ms=server_processing_ms,
                    transform_case_counts=transform_case_counts,
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
            self.transform_cursors_after_operation(
                transformed_op,
                document_length=len(next_content),
                exclude_key=connection.key,
            )

            if self.settings.snapshot_every_ops > 0 and next_version % self.settings.snapshot_every_ops == 0:
                await self.repository.persist_snapshot(self.doc_id, next_version, next_content)

        server_ts = utc_now().isoformat()
        server_processing_ms = (time.perf_counter() - processing_started_at) * 1000
        self.metrics.record_transform(
            transform_required=transform_required,
            case_counts=transform_case_counts,
            server_processing_ms=server_processing_ms,
        )
        await self.send_ack(
            connection,
            str(message.op_id),
            next_version,
            transformed_op,
            transform_required=transform_required,
            server_ts=server_ts,
            server_processing_ms=server_processing_ms,
            transform_case_counts=transform_case_counts,
        )
        broadcast_recipient_count = await self.broadcast(
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
        self.metrics.record_remote_delivery(broadcast_recipient_count)
        await self.repository.record_metric(
            self.doc_id,
            "operation_accepted",
            {
                "server_version": next_version,
                "transform_required": transform_required,
                "transform_ms": transform_ms,
                "transform_case_counts": dict(transform_case_counts),
                "server_processing_ms": server_processing_ms,
                "broadcast_recipient_count": broadcast_recipient_count,
                "client_latency_ms": latency_since_client_ts(message.client_ts),
            },
        )

    async def handle_cursor(self, connection: ClientConnection, cursor: CursorState) -> None:
        """Store and broadcast a cursor update."""

        connection.cursor = cursor
        await self.broadcast({"type": "cursor", "cursor": cursor.model_dump(mode="json")}, exclude_key=connection.key)

    async def send_ack(
        self,
        connection: ClientConnection,
        op_id: str,
        server_version: int,
        op: dict[str, Any],
        *,
        transform_required: bool,
        server_ts: str | None = None,
        server_processing_ms: float | None = None,
        transform_case_counts: dict[TransformCase, int] | None = None,
    ) -> None:
        """Send an operation acknowledgement to one client."""

        await self.send(
            connection.websocket,
            {
                "type": "ack",
                "op_id": op_id,
                "server_version": server_version,
                "op": op,
                "transform_required": transform_required,
                "server_ts": server_ts or utc_now().isoformat(),
                "server_processing_ms": server_processing_ms,
                "transform_case_counts": dict(transform_case_counts or empty_transform_case_counts()),
            },
        )
        self.metrics.record_acknowledgement()

    async def broadcast_presence(self) -> None:
        """Broadcast current in-room presence to all connected clients."""

        await self.broadcast({"type": "presence", "users": self.presence_payload()})

    def presence_payload(self, exclude_key: str | None = None) -> list[dict[str, Any]]:
        """Return serialized cursor state for all connected clients except one."""

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

    def transform_cursors_after_operation(
        self,
        op: dict[str, Any],
        *,
        document_length: int,
        exclude_key: str | None = None,
    ) -> None:
        """Shift stored remote cursor coordinates after an accepted operation."""

        for key, connection in self.clients.items():
            if key == exclude_key or connection.cursor is None:
                continue

            connection.cursor = transform_cursor_state(
                connection.cursor,
                op,
                document_length=document_length,
            )

    async def broadcast(self, payload: dict[str, Any], *, exclude_key: str | None = None) -> int:
        """Send a JSON payload to connected clients and return successful sends."""

        stale_keys: list[str] = []
        delivered_count = 0

        for key, connection in self.clients.items():
            if key == exclude_key:
                continue
            try:
                await self.send(connection.websocket, payload)
                delivered_count += 1
            except RuntimeError:
                stale_keys.append(key)

        for key in stale_keys:
            self.clients.pop(key, None)

        return delivered_count

    async def send(self, websocket: WebSocket, payload: dict[str, Any]) -> None:
        """Send a JSON payload over a WebSocket."""

        await websocket.send_json(payload)

    async def send_error(
        self, websocket: WebSocket, code: str, message: str, recoverable: bool
    ) -> None:
        """Send a protocol error payload."""

        await self.send(
            websocket,
            {"type": "error", "code": code, "message": message, "recoverable": recoverable},
        )


class RoomManager:
    """Creates and caches collaboration rooms per document id."""

    def __init__(self, repository: CollaborationRepository, settings: Settings) -> None:
        self.repository = repository
        self.settings = settings
        self.rooms: dict[str, Room] = {}
        self.manager_lock = asyncio.Lock()

    async def get_room(self, doc_id: str) -> Room:
        """Return an existing room or create it from the persisted snapshot."""

        async with self.manager_lock:
            existing = self.rooms.get(doc_id)
            if existing:
                return existing

            snapshot = await self.repository.get_or_create_document(doc_id)
            room = Room(snapshot, self.repository, self.settings)
            self.rooms[doc_id] = room
            return room


def operation_from_model(operation: CollabOperation) -> AcceptedOperation:
    """Map an ORM operation into transformation history."""

    return AcceptedOperation(
        op_id=str(operation.op_id),
        client_id=operation.client_id,
        op=operation.op,
        server_version=operation.server_version,
    )


def document_snapshot_from_model(document: CollabDocument) -> DocumentSnapshot:
    """Map an ORM collaboration document into a domain snapshot."""

    return DocumentSnapshot(
        doc_id=str(document.doc_id),
        content=document.content,
        version=document.version,
        updated_at=document.updated_at,
    )


def append_float(values: list[float], value: object) -> None:
    """Append a finite float-like metric value when it can be parsed."""

    if value is None:
        return

    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return

    values.append(parsed)


def average(values: list[float]) -> float | None:
    """Return an arithmetic average or ``None`` for an empty sample list."""

    if not values:
        return None
    return sum(values) / len(values)


def to_transform_case_counts(case_counts: dict[TransformCase, int]) -> TransformCaseCounts:
    """Map slash-separated transform counters into API response fields."""

    return TransformCaseCounts(
        insert_insert=case_counts["insert/insert"],
        insert_delete=case_counts["insert/delete"],
        delete_insert=case_counts["delete/insert"],
        delete_delete=case_counts["delete/delete"],
    )


def latency_since_client_ts(client_ts: datetime | None) -> float | None:
    """Return server-observed latency from client timestamp to now in milliseconds."""

    if client_ts is None:
        return None

    now = utc_now()
    comparable_ts = client_ts
    if comparable_ts.tzinfo is None:
        comparable_ts = comparable_ts.replace(tzinfo=now.tzinfo)

    return max(0.0, (now - comparable_ts).total_seconds() * 1000)
