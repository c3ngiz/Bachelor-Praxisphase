"""Workspace hierarchy, item type, and sharing ORM models."""

from __future__ import annotations

import enum
from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, func, text
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.collaboration import CollabDocument
    from app.db.models.document import DocumentContent
    from app.db.models.user import User


class WorkspaceItemType(str, enum.Enum):
    """Persisted workspace item categories."""

    FOLDER = "FOLDER"
    DOCUMENT = "DOCUMENT"


class WorkspacePermission(str, enum.Enum):
    """Persisted direct share permission values."""

    READ = "READ"
    WRITE = "WRITE"


class WorkspaceItem(Base):
    """Folder or document node in the user-visible workspace tree."""

    __tablename__ = "workspace_items"
    __table_args__ = (
        Index("workspace_items_deletedAt_idx", "deletedAt"),
        Index("workspace_items_ownerId_idx", "ownerId"),
        Index("workspace_items_parentId_idx", "parentId"),
        Index("workspace_items_type_idx", "type"),
    )

    id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    type: Mapped[WorkspaceItemType] = mapped_column(
        Enum(
            WorkspaceItemType,
            name="WorkspaceItemType",
            values_callable=lambda values: [item.value for item in values],
        ),
        nullable=False,
    )
    owner_id: Mapped[UUID] = mapped_column(
        "ownerId", PgUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    parent_id: Mapped[UUID | None] = mapped_column(
        "parentId",
        PgUUID(as_uuid=True),
        ForeignKey("workspace_items.id", ondelete="CASCADE"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt",
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        "deletedAt", DateTime(timezone=True), nullable=True
    )

    owner: Mapped["User"] = relationship("User", back_populates="owned_items", lazy="selectin")
    parent: Mapped["WorkspaceItem | None"] = relationship(
        "WorkspaceItem", remote_side=[id], back_populates="children", lazy="selectin"
    )
    children: Mapped[list["WorkspaceItem"]] = relationship(
        "WorkspaceItem", back_populates="parent", lazy="selectin"
    )
    shares: Mapped[list["WorkspaceShare"]] = relationship(
        "WorkspaceShare",
        back_populates="item",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="WorkspaceShare.created_at",
    )
    document_content: Mapped["DocumentContent | None"] = relationship(
        "DocumentContent", back_populates="item", uselist=False, cascade="all, delete-orphan"
    )
    collab_document: Mapped["CollabDocument | None"] = relationship(
        "CollabDocument", back_populates="item", uselist=False, cascade="all, delete-orphan"
    )


class WorkspaceShare(Base):
    """Direct collaborator grant on a workspace item."""

    __tablename__ = "workspace_shares"
    __table_args__ = (
        Index("workspace_shares_itemId_userId_key", "itemId", "userId", unique=True),
        Index("workspace_shares_itemId_idx", "itemId"),
        Index("workspace_shares_userId_idx", "userId"),
    )

    id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    item_id: Mapped[UUID] = mapped_column(
        "itemId",
        PgUUID(as_uuid=True),
        ForeignKey("workspace_items.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[UUID] = mapped_column(
        "userId", PgUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    permission: Mapped[WorkspacePermission] = mapped_column(
        Enum(
            WorkspacePermission,
            name="WorkspacePermission",
            values_callable=lambda values: [item.value for item in values],
        ),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt",
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    item: Mapped[WorkspaceItem] = relationship("WorkspaceItem", back_populates="shares")
    user: Mapped["User"] = relationship("User", back_populates="shares", lazy="selectin")
