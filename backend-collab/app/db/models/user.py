"""User ORM model for authentication, ownership, and collaboration identity."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import DateTime, String, func, text
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.collaboration import CollabOperation
    from app.db.models.workspace import WorkspaceItem, WorkspaceShare


class User(Base):
    """Application user with password credentials and display metadata."""

    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    password_hash: Mapped[str] = mapped_column("passwordHash", String(255), nullable=False)
    avatar_color: Mapped[str | None] = mapped_column("avatarColor", String(64), nullable=True)
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

    owned_items: Mapped[list["WorkspaceItem"]] = relationship(
        "WorkspaceItem", back_populates="owner", cascade="all, delete-orphan"
    )
    shares: Mapped[list["WorkspaceShare"]] = relationship(
        "WorkspaceShare", back_populates="user", cascade="all, delete-orphan"
    )
    collab_operations: Mapped[list["CollabOperation"]] = relationship(
        "CollabOperation", back_populates="user", cascade="all, delete-orphan"
    )
