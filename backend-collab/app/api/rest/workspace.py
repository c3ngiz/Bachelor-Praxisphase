"""REST workspace routes for explorer, sharing, and move operations."""

from __future__ import annotations

from fastapi import APIRouter, Query, Response, status

from app.common.dependencies import CurrentUser, DbSession
from app.domain.workspace.schemas import (
    CollaboratorsEnvelope,
    CreateDocumentRequest,
    CreateFolderRequest,
    MoveTargetsEnvelope,
    MoveWorkspaceItemRequest,
    RenameWorkspaceItemRequest,
    ShareWorkspaceItemRequest,
    UpdateCollaboratorRequest,
    WorkspaceEnvelope,
    WorkspaceItemEnvelope,
)
from app.domain.workspace.service import WorkspaceService

router = APIRouter(prefix="/workspace", tags=["workspace"])


@router.get("/items", response_model=WorkspaceEnvelope)
async def list_items(
    current_user: CurrentUser,
    db: DbSession,
    parent_id: str | None = Query(default=None, alias="parentId"),
) -> WorkspaceEnvelope:
    """List root items or direct children of a folder."""

    workspace = await WorkspaceService(db).list_items(str(current_user.id), parent_id)
    return WorkspaceEnvelope(workspace=workspace)


@router.get("/items/{item_id}", response_model=WorkspaceItemEnvelope)
async def get_item(current_user: CurrentUser, db: DbSession, item_id: str) -> WorkspaceItemEnvelope:
    """Return one accessible workspace item."""

    item = await WorkspaceService(db).get_item(str(current_user.id), item_id)
    return WorkspaceItemEnvelope(item=item)


@router.get("/search", response_model=WorkspaceEnvelope)
async def search_items(
    current_user: CurrentUser,
    db: DbSession,
    q: str = Query(default=""),
) -> WorkspaceEnvelope:
    """Search visible workspace items by name."""

    workspace = await WorkspaceService(db).search_items(str(current_user.id), q)
    return WorkspaceEnvelope(workspace=workspace)


@router.post("/folders", response_model=WorkspaceItemEnvelope, status_code=status.HTTP_201_CREATED)
async def create_folder(
    current_user: CurrentUser,
    db: DbSession,
    input: CreateFolderRequest,
) -> WorkspaceItemEnvelope:
    """Create a folder in root or inside a writable folder."""

    item = await WorkspaceService(db).create_folder(str(current_user.id), input)
    return WorkspaceItemEnvelope(item=item)


@router.post("/documents", response_model=WorkspaceItemEnvelope, status_code=status.HTTP_201_CREATED)
async def create_document(
    current_user: CurrentUser,
    db: DbSession,
    input: CreateDocumentRequest,
) -> WorkspaceItemEnvelope:
    """Create a document shell and its initial content row."""

    item = await WorkspaceService(db).create_document(str(current_user.id), input)
    return WorkspaceItemEnvelope(item=item)


@router.patch("/items/{item_id}/rename", response_model=WorkspaceItemEnvelope)
async def rename_item(
    current_user: CurrentUser,
    db: DbSession,
    item_id: str,
    input: RenameWorkspaceItemRequest,
) -> WorkspaceItemEnvelope:
    """Rename a workspace item when the user has write access."""

    item = await WorkspaceService(db).rename_item(str(current_user.id), item_id, input)
    return WorkspaceItemEnvelope(item=item)


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(current_user: CurrentUser, db: DbSession, item_id: str) -> Response:
    """Soft-delete an item and descendants when the current user is owner."""

    await WorkspaceService(db).delete_item(str(current_user.id), item_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/move-targets", response_model=MoveTargetsEnvelope)
async def list_move_targets(
    current_user: CurrentUser,
    db: DbSession,
    exclude_item_id: str = Query(alias="excludeItemId"),
) -> MoveTargetsEnvelope:
    """List valid destination folders for the move dialog."""

    targets = await WorkspaceService(db).list_move_targets(str(current_user.id), exclude_item_id)
    return MoveTargetsEnvelope(targets=targets)


@router.patch("/items/{item_id}/move", response_model=WorkspaceItemEnvelope)
async def move_item(
    current_user: CurrentUser,
    db: DbSession,
    item_id: str,
    input: MoveWorkspaceItemRequest,
) -> WorkspaceItemEnvelope:
    """Move an item into root or a writable destination folder."""

    item = await WorkspaceService(db).move_item(str(current_user.id), item_id, input)
    return WorkspaceItemEnvelope(item=item)


@router.post("/items/{item_id}/share", response_model=WorkspaceItemEnvelope)
async def share_item(
    current_user: CurrentUser,
    db: DbSession,
    item_id: str,
    input: ShareWorkspaceItemRequest,
) -> WorkspaceItemEnvelope:
    """Share an item with an existing user by email."""

    item = await WorkspaceService(db).share_item(str(current_user.id), item_id, input)
    return WorkspaceItemEnvelope(item=item)


@router.get("/items/{item_id}/collaborators", response_model=CollaboratorsEnvelope)
async def list_collaborators(
    current_user: CurrentUser,
    db: DbSession,
    item_id: str,
) -> CollaboratorsEnvelope:
    """List direct collaborators on an accessible item."""

    collaborators = await WorkspaceService(db).list_collaborators(str(current_user.id), item_id)
    return CollaboratorsEnvelope(collaborators=collaborators)


@router.patch("/items/{item_id}/collaborators/{user_id}", response_model=WorkspaceItemEnvelope)
async def update_collaborator(
    current_user: CurrentUser,
    db: DbSession,
    item_id: str,
    user_id: str,
    input: UpdateCollaboratorRequest,
) -> WorkspaceItemEnvelope:
    """Update direct collaborator permission when the current user is owner."""

    item = await WorkspaceService(db).update_collaborator(
        str(current_user.id), item_id, user_id, input.permission
    )
    return WorkspaceItemEnvelope(item=item)


@router.delete("/items/{item_id}/collaborators/{user_id}", response_model=WorkspaceItemEnvelope)
async def remove_collaborator(
    current_user: CurrentUser,
    db: DbSession,
    item_id: str,
    user_id: str,
) -> WorkspaceItemEnvelope:
    """Remove direct collaborator access when the current user is owner."""

    item = await WorkspaceService(db).remove_collaborator(str(current_user.id), item_id, user_id)
    return WorkspaceItemEnvelope(item=item)
