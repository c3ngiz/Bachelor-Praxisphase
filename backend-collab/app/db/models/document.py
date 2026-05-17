"""Document content model storing editor JSON and revision metadata."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Any
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Integer, func, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.workspace import WorkspaceItem


class DocumentContent(Base):
    """TipTap/ProseMirror JSON content and autosave revision for a document item."""

    __tablename__ = "document_contents"

    id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    item_id: Mapped[UUID] = mapped_column(
        "itemId",
        PgUUID(as_uuid=True),
        ForeignKey("workspace_items.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    content: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        server_default=text('\'{"type":"doc","content":[{"type":"paragraph"}]}\'::jsonb'),
    )
    revision: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("1"))
    last_opened_at: Mapped[datetime | None] = mapped_column(
        "lastOpenedAt", DateTime(timezone=True), nullable=True
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

    item: Mapped["WorkspaceItem"] = relationship("WorkspaceItem", back_populates="document_content")
