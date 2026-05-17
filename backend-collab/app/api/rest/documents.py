"""REST document content routes for editor loading and autosave."""

from __future__ import annotations

from fastapi import APIRouter, Query

from app.common.dependencies import CurrentUser, DbSession
from app.domain.documents.schemas import DocumentContentResponse, UpdateDocumentContentRequest
from app.domain.documents.service import DocumentsService

router = APIRouter(prefix="/workspace/documents", tags=["documents"])


@router.get("/{document_id}/content", response_model=DocumentContentResponse)
async def get_content(
    current_user: CurrentUser,
    db: DbSession,
    document_id: str,
    touch: str | None = Query(default=None),
) -> DocumentContentResponse:
    """Load document content and permission state for editor sessions."""

    should_touch = touch not in {"false", "0"}
    return await DocumentsService(db).get_content(
        str(current_user.id), document_id, touch_last_opened_at=should_touch
    )


@router.patch("/{document_id}/content", response_model=DocumentContentResponse)
async def update_content(
    current_user: CurrentUser,
    db: DbSession,
    document_id: str,
    input: UpdateDocumentContentRequest,
) -> DocumentContentResponse:
    """Save or autosave document content and increment its revision."""

    return await DocumentsService(db).update_content(str(current_user.id), document_id, input)
