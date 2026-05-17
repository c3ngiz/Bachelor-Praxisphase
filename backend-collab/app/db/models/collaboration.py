"""Operational-transform persistence models for live document collaboration."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Any
from uuid import UUID

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Index, Integer, String, Text, func, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.user import User
    from app.db.models.workspace import WorkspaceItem


class CollabDocument(Base):
    """Plain-text collaboration state derived from a workspace document."""

    __tablename__ = "collab_documents"

    doc_id: Mapped[UUID] = mapped_column(
        "doc_id",
        PgUUID(as_uuid=True),
        ForeignKey("workspace_items.id", ondelete="CASCADE"),
        primary_key=True,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("''"))
    version: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    updated_at: Mapped[datetime] = mapped_column(
        "updated_at", DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    item: Mapped["WorkspaceItem"] = relationship("WorkspaceItem", back_populates="collab_document")
    operations: Mapped[list["CollabOperation"]] = relationship(
        "CollabOperation", back_populates="document", cascade="all, delete-orphan"
    )
    snapshots: Mapped[list["CollabSnapshot"]] = relationship(
        "CollabSnapshot", back_populates="document", cascade="all, delete-orphan"
    )
    metrics: Mapped[list["CollabMetricEvent"]] = relationship(
        "CollabMetricEvent", back_populates="document", cascade="all, delete-orphan"
    )


class CollabOperation(Base):
    """Accepted text operation after server-side transformation."""

    __tablename__ = "collab_operations"
    __table_args__ = (
        Index("collab_operations_doc_id_server_version_key", "doc_id", "server_version", unique=True),
        Index("collab_operations_doc_id_idx", "doc_id"),
        Index("collab_operations_client_id_idx", "client_id"),
        Index("collab_operations_created_at_idx", "created_at"),
    )

    op_id: Mapped[UUID] = mapped_column(
        "op_id", PgUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    doc_id: Mapped[UUID] = mapped_column(
        "doc_id",
        PgUUID(as_uuid=True),
        ForeignKey("collab_documents.doc_id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[UUID] = mapped_column(
        "user_id", PgUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    client_id: Mapped[str] = mapped_column("client_id", String(120), nullable=False)
    base_version: Mapped[int] = mapped_column("base_version", Integer, nullable=False)
    raw_op: Mapped[dict[str, Any]] = mapped_column("raw_op", JSONB, nullable=False)
    op: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    server_version: Mapped[int] = mapped_column("server_version", Integer, nullable=False)
    client_ts: Mapped[datetime | None] = mapped_column(
        "client_ts", DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        "created_at", DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    transform_required: Mapped[bool] = mapped_column("transform_required", Boolean, nullable=False)
    transform_ms: Mapped[float] = mapped_column(
        "transform_ms", Float, nullable=False, server_default=text("0")
    )

    document: Mapped[CollabDocument] = relationship("CollabDocument", back_populates="operations")
    user: Mapped["User"] = relationship("User", back_populates="collab_operations", lazy="selectin")


class CollabSnapshot(Base):
    """Periodic plain-text snapshot used for diagnostics and later compaction."""

    __tablename__ = "collab_snapshots"
    __table_args__ = (Index("collab_snapshots_doc_id_version_idx", "doc_id", "version"),)

    snapshot_id: Mapped[UUID] = mapped_column(
        "snapshot_id",
        PgUUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    doc_id: Mapped[UUID] = mapped_column(
        "doc_id",
        PgUUID(as_uuid=True),
        ForeignKey("collab_documents.doc_id", ondelete="CASCADE"),
        nullable=False,
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        "created_at", DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    document: Mapped[CollabDocument] = relationship("CollabDocument", back_populates="snapshots")


class CollabMetricEvent(Base):
    """Diagnostic event emitted by collaboration rooms."""

    __tablename__ = "collab_metric_events"
    __table_args__ = (
        Index("collab_metric_events_doc_id_event_type_idx", "doc_id", "event_type"),
        Index("collab_metric_events_created_at_idx", "created_at"),
    )

    event_id: Mapped[UUID] = mapped_column(
        "event_id", PgUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    doc_id: Mapped[UUID] = mapped_column(
        "doc_id",
        PgUUID(as_uuid=True),
        ForeignKey("collab_documents.doc_id", ondelete="CASCADE"),
        nullable=False,
    )
    event_type: Mapped[str] = mapped_column("event_type", String(80), nullable=False)
    payload: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        "created_at", DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    document: Mapped[CollabDocument] = relationship("CollabDocument", back_populates="metrics")
