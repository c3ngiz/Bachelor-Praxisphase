"""Document content loading, saving, revisioning, and OT synchronization."""

from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.datetime import to_iso, utc_now
from app.core.errors import ConflictAppError
from app.db.models.collaboration import CollabDocument
from app.db.models.document import DocumentContent
from app.db.models.workspace import WorkspaceItem
from app.domain.documents.events import document_content_events
from app.domain.documents.schemas import DocumentContentResponse, UpdateDocumentContentRequest
from app.domain.workspace.service import DEFAULT_DOCUMENT_CONTENT, WorkspaceService


class DocumentsService:
    """Handles document JSON content and optimistic revision behavior."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.workspace = WorkspaceService(db)

    async def get_content(
        self,
        user_id: str,
        document_id: str,
        *,
        touch_last_opened_at: bool = True,
    ) -> DocumentContentResponse:
        """Load document content for read-only or editable editor sessions."""

        item = await self.workspace.get_accessible_record(user_id, document_id)
        self.workspace.assert_document(item)
        access = await self.workspace.resolve_access_or_throw(user_id, item)
        content = await self.get_or_create_content(item, touch_last_opened_at=touch_last_opened_at)

        if touch_last_opened_at:
            await self.db.commit()

        document = await self.workspace.get_item(user_id, str(item.id))
        return DocumentContentResponse(
            document_id=str(item.id),
            document=document,
            content=content.content,
            revision=content.revision,
            can_write=access.can_write,
            updated_at=to_iso(content.updated_at) or "",
        )

    async def update_content(
        self,
        user_id: str,
        document_id: str,
        input: UpdateDocumentContentRequest,
    ) -> DocumentContentResponse:
        """Save TipTap JSON content and increment the revision exactly once."""

        item = await self.workspace.assert_can_write_item(user_id, document_id)
        self.workspace.assert_document(item)

        next_name = input.name or input.title
        if next_name and next_name.strip() and next_name.strip() != item.name:
            await self.workspace.rename_item(user_id, str(item.id), next_name)
            item = await self.workspace.get_accessible_record(user_id, str(item.id))

        content = await self.get_or_create_content(item, touch_last_opened_at=False)

        if input.revision and content.revision != input.revision:
            raise ConflictAppError(
                "Document content has changed since it was loaded.",
                code="DOCUMENT_REVISION_CONFLICT",
            )

        now = utc_now()
        content.content = input.content
        content.revision += 1
        content.updated_at = now
        item.updated_at = now
        await self.sync_collaboration_document(str(item.id), extract_tiptap_text(input.content))
        await self.db.commit()
        response = await self.get_content(user_id, str(item.id), touch_last_opened_at=False)
        await document_content_events.publish(str(item.id), response)
        return response

    async def get_or_create_content(
        self,
        item: WorkspaceItem,
        *,
        touch_last_opened_at: bool,
    ) -> DocumentContent:
        """Load a document content row, creating it when old data lacks one."""

        result = await self.db.execute(
            select(DocumentContent).where(DocumentContent.item_id == item.id)
        )
        content = result.scalar_one_or_none()
        now = utc_now()

        if content:
            if touch_last_opened_at:
                content.last_opened_at = now
                content.updated_at = now
            return content

        content = DocumentContent(
            item_id=item.id,
            content=DEFAULT_DOCUMENT_CONTENT,
            last_opened_at=now if touch_last_opened_at else None,
        )
        self.db.add(content)
        await self.db.flush()
        return content

    async def sync_collaboration_document(self, document_id: str, plain_text: str) -> None:
        """Mirror JSON saves into the plain-text OT document used by WebSockets."""

        result = await self.db.execute(
            select(CollabDocument).where(CollabDocument.doc_id == document_id)
        )
        collab_document = result.scalar_one_or_none()

        if collab_document:
            collab_document.content = plain_text
            collab_document.version += 1
            collab_document.updated_at = utc_now()
            return

        self.db.add(CollabDocument(doc_id=document_id, content=plain_text, version=0))


def extract_tiptap_text(node: Any) -> str:
    """Extract plain text from the TipTap/ProseMirror JSON tree for OT sessions."""

    if not isinstance(node, dict):
        return ""

    node_type = node.get("type")

    if node_type == "text":
        return str(node.get("text", ""))

    children = node.get("content")

    if not isinstance(children, list):
        return ""

    rendered_children = [extract_tiptap_text(child) for child in children]

    if node_type == "doc":
        return "\n".join(part for part in rendered_children if part)

    if node_type in {"paragraph", "heading", "listItem"}:
        return "".join(rendered_children)

    if node_type in {"bulletList", "orderedList"}:
        return "\n".join(part for part in rendered_children if part)

    return "".join(rendered_children)


def plain_text_to_tiptap(content: str) -> dict[str, Any]:
    """Convert plain text from the collaboration engine into simple TipTap JSON."""

    paragraphs = content.split("\n") or [""]
    return {
        "type": "doc",
        "content": [
            {
                "type": "paragraph",
                "content": [{"type": "text", "text": paragraph}] if paragraph else [],
            }
            for paragraph in paragraphs
        ],
    }
