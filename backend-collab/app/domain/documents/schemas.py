"""Pydantic schemas for document editor content endpoints."""

from __future__ import annotations

from typing import Any

from pydantic import Field, field_validator

from app.common.schemas import CamelModel
from app.domain.workspace.schemas import WorkspaceItemResponse


class UpdateDocumentContentRequest(CamelModel):
    """Request body for document save and autosave endpoints."""

    content: dict[str, Any]
    revision: int | None = Field(default=None, ge=1)
    title: str | None = Field(default=None, max_length=160)
    name: str | None = Field(default=None, max_length=160)

    @field_validator("title", "name")
    @classmethod
    def strip_optional_name(cls, value: str | None) -> str | None:
        """Trim optional title/name aliases before a rename side effect."""

        return value.strip() if value else value


class DocumentContentResponse(CamelModel):
    """Document content payload returned by REST and GraphQL editor APIs."""

    document_id: str
    document: WorkspaceItemResponse
    content: dict[str, Any]
    revision: int
    can_write: bool
    updated_at: str
