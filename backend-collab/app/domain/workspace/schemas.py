"""Pydantic schemas for workspace explorer and sharing flows."""

from __future__ import annotations

from typing import Literal

from pydantic import EmailStr, Field, field_validator

from app.common.schemas import CamelModel

PermissionLevel = Literal["owner", "write", "read"]
SharePermission = Literal["write", "read"]
WorkspaceKind = Literal["folder", "document"]
SharingStatus = Literal["private", "shared-by-me", "shared-with-me"]


class WorkspaceUserSummary(CamelModel):
    """Small user summary attached to owners and collaborators."""

    id: str
    name: str
    email: str | None = None
    initials: str | None = None
    avatar_color: str | None = None


class CollaboratorResponse(CamelModel):
    """Direct collaborator entry returned in item metadata and collaborator lists."""

    id: str
    user_id: str
    name: str
    email: str
    initials: str
    avatar_color: str
    role: SharePermission
    permission: SharePermission
    created_at: str
    updated_at: str


class WorkspaceItemResponse(CamelModel):
    """Frontend-compatible folder/document metadata response."""

    id: str
    kind: WorkspaceKind
    type: WorkspaceKind
    name: str
    title: str
    parent_id: str | None
    owner: WorkspaceUserSummary
    owner_id: str
    owner_name: str
    owner_email: str
    current_user_role: PermissionLevel
    permission: PermissionLevel
    sharing_status: SharingStatus
    visibility: Literal["private", "shared", "workspace"]
    can_edit: bool
    can_write: bool
    can_share: bool
    can_manage: bool
    can_delete: bool
    collaborators: list[CollaboratorResponse]
    created_at: str
    updated_at: str
    revision: int | None = None
    last_opened_at: str | None = None
    child_count: int | None = None


class WorkspaceBreadcrumbResponse(CamelModel):
    """Breadcrumb segment for a listed folder."""

    id: str | None
    name: str


class WorkspaceItemsResponse(CamelModel):
    """Folder listing response accepted by REST and GraphQL clients."""

    folder_id: str | None
    parent_id: str | None
    breadcrumbs: list[WorkspaceBreadcrumbResponse]
    items: list[WorkspaceItemResponse]


class WorkspaceEnvelope(CamelModel):
    """REST wrapper used by the current workspace REST client."""

    workspace: WorkspaceItemsResponse


class WorkspaceItemEnvelope(CamelModel):
    """REST wrapper for created or updated workspace items."""

    item: WorkspaceItemResponse


class CollaboratorsEnvelope(CamelModel):
    """REST wrapper for direct collaborator listings."""

    collaborators: list[CollaboratorResponse]


class MoveTargetResponse(CamelModel):
    """Folder destination entry shown in the move dialog."""

    id: str | None
    name: str
    path: str
    can_move_here: bool


class MoveTargetsEnvelope(CamelModel):
    """REST wrapper for move destination lists."""

    targets: list[MoveTargetResponse]


class CreateFolderRequest(CamelModel):
    """Request body for folder creation."""

    name: str = Field(min_length=1, max_length=160)
    parent_id: str | None = None

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        """Trim names so duplicate checks match persisted values."""

        return value.strip()


class CreateDocumentRequest(CreateFolderRequest):
    """Request body for document creation."""


class RenameWorkspaceItemRequest(CamelModel):
    """Request body for renaming a workspace item."""

    name: str = Field(min_length=1, max_length=160)

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        """Trim names before validation and persistence."""

        return value.strip()


class MoveWorkspaceItemRequest(CamelModel):
    """Request body for moving an item into root or a folder."""

    target_folder_id: str | None = None


class ShareWorkspaceItemRequest(CamelModel):
    """Request body for sharing an item with an existing user."""

    email: EmailStr
    permission: SharePermission


class UpdateCollaboratorRequest(CamelModel):
    """Request body for updating a direct collaborator permission."""

    permission: SharePermission


class DeleteResult(CamelModel):
    """GraphQL-compatible delete mutation result."""

    success: bool
