from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, Field, NonNegativeInt, PositiveInt


class InsertOp(BaseModel):
    type: Literal["insert"]
    pos: NonNegativeInt
    text: str


class DeleteOp(BaseModel):
    type: Literal["delete"]
    pos: NonNegativeInt
    len: PositiveInt


TextOp = Annotated[InsertOp | DeleteOp, Field(discriminator="type")]


class CursorState(BaseModel):
    user_id: str
    client_id: str
    pos: NonNegativeInt
    selection_start: NonNegativeInt
    selection_end: NonNegativeInt
    color: str
    display_name: str
    ts: datetime


class JoinMessage(BaseModel):
    type: Literal["join"]
    client_id: str


class ClientOpMessage(BaseModel):
    type: Literal["op"]
    op_id: UUID
    client_id: str
    doc_id: UUID
    base_version: NonNegativeInt
    op: TextOp
    client_ts: datetime
    client_hash: str | None = None


class CursorMessage(BaseModel):
    type: Literal["cursor"]
    cursor: CursorState


class PresenceMessage(BaseModel):
    type: Literal["presence"]
    client_id: str
    status: Literal["active", "idle", "away"]
    ts: datetime


class PingMessage(BaseModel):
    type: Literal["ping"]
    ping_id: str
    client_ts: datetime


ClientMessage = Annotated[
    JoinMessage | ClientOpMessage | CursorMessage | PresenceMessage | PingMessage,
    Field(discriminator="type"),
]


class UserSession(BaseModel):
    user_id: str
    email: str
    name: str
    avatar_color: str | None = None


class WorkspaceAccess(BaseModel):
    doc_id: str
    title: str
    permission: Literal["owner", "write", "read"]

    @property
    def can_write(self) -> bool:
        return self.permission in {"owner", "write"}


class DocumentSnapshot(BaseModel):
    doc_id: str
    content: str
    version: int
    updated_at: datetime


class AcceptedOperation(BaseModel):
    op_id: str
    client_id: str
    op: dict
    server_version: int


def utc_now() -> datetime:
    return datetime.now(timezone.utc)
