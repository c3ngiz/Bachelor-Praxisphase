"""Pydantic schemas used by collaboration WebSocket, REST, and GraphQL APIs."""

from __future__ import annotations

from datetime import datetime
from typing import Annotated, Literal
from uuid import UUID

from app.common.schemas import CamelModel

from pydantic import BaseModel, Field, NonNegativeInt, PositiveInt


class InsertOp(BaseModel):
    """Text insertion operation using code-point positions."""

    type: Literal["insert"]
    pos: NonNegativeInt
    text: str


class DeleteOp(BaseModel):
    """Text deletion operation using code-point positions."""

    type: Literal["delete"]
    pos: NonNegativeInt
    len: PositiveInt


TextOp = Annotated[InsertOp | DeleteOp, Field(discriminator="type")]


class CursorState(BaseModel):
    """Presence cursor payload exchanged over the editor WebSocket."""

    user_id: str
    client_id: str
    pos: NonNegativeInt
    selection_start: NonNegativeInt
    selection_end: NonNegativeInt
    color: str
    display_name: str
    ts: datetime


class JoinMessage(BaseModel):
    """First required WebSocket message that identifies the browser client."""

    type: Literal["join"]
    client_id: str


class ClientOpMessage(BaseModel):
    """Client operation submitted for server transformation and persistence."""

    type: Literal["op"]
    op_id: UUID
    client_id: str
    doc_id: UUID
    base_version: NonNegativeInt
    op: TextOp
    client_ts: datetime
    client_hash: str | None = None


class CursorMessage(BaseModel):
    """Cursor update message sent by the editor."""

    type: Literal["cursor"]
    cursor: CursorState


class PresenceMessage(BaseModel):
    """Presence status update sent by the editor."""

    type: Literal["presence"]
    client_id: str
    status: Literal["active", "idle", "away"]
    ts: datetime


class PingMessage(BaseModel):
    """Application-level ping message used for latency checks."""

    type: Literal["ping"]
    ping_id: str
    client_ts: datetime


ClientMessage = Annotated[
    JoinMessage | ClientOpMessage | CursorMessage | PresenceMessage | PingMessage,
    Field(discriminator="type"),
]


class UserSession(BaseModel):
    """Authenticated user snapshot needed by a collaboration connection."""

    user_id: str
    email: str
    name: str
    avatar_color: str | None = None


class WorkspaceAccess(BaseModel):
    """Resolved document access for a WebSocket connection."""

    doc_id: str
    title: str
    permission: Literal["owner", "write", "read"]

    @property
    def can_write(self) -> bool:
        """Return whether this access allows operation submission."""

        return self.permission in {"owner", "write"}


class DocumentSnapshot(BaseModel):
    """Current plain-text collaboration document state."""

    doc_id: str
    content: str
    version: int
    updated_at: datetime


class AcceptedOperation(BaseModel):
    """Persisted operation loaded for retries or transformation history."""

    op_id: str
    client_id: str
    op: dict
    server_version: int


class TransformCaseCounts(CamelModel):
    """Counters for the four plain-text pairwise OT transform cases."""

    insert_insert: int = 0
    insert_delete: int = 0
    delete_insert: int = 0
    delete_delete: int = 0


class CollaborationMetricsResponse(CamelModel):
    """Document-level collaboration metrics returned by REST and GraphQL."""

    document_id: str
    version: int
    content_length: int
    total_operations_sent: int
    acknowledged_operations: int
    remote_operations_received: int
    transformed_operations: int
    transform_case_counts: TransformCaseCounts
    avg_ack_latency_ms: float | None = None
    avg_server_processing_ms: float | None = None
    divergence_events: int = 0
    last_operation_at: str | None = None


class CollaborationHashCheckRequest(CamelModel):
    """Client hash comparison request for divergence detection."""

    version: NonNegativeInt
    hash: str


class CollaborationHashCheckResponse(CamelModel):
    """Hash comparison result used by the editor divergence indicator."""

    document_id: str
    version: int
    client_version: int
    server_hash: str
    client_hash: str
    in_sync: bool
    version_matches: bool
    hash_matches: bool
    checked_at: str


class CollaborationSnapshotResponse(CamelModel):
    """Plain-text server snapshot used for safe client resynchronization."""

    document_id: str
    content: str
    version: int
    hash: str
    can_write: bool
    updated_at: str
