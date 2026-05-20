"""Strawberry GraphQL types, inputs, and Pydantic-to-GraphQL mappers."""

from __future__ import annotations

from typing import Any

import strawberry
from strawberry.scalars import JSON

from app.domain.auth.schemas import AuthSessionResponse, AuthUserResponse
from app.domain.collaboration.schemas import (
    CollaborationHashCheckResponse,
    CollaborationMetricsResponse,
    CollaborationSnapshotResponse,
)
from app.domain.documents.schemas import DocumentContentResponse
from app.domain.workspace.schemas import (
    CollaboratorResponse,
    MoveTargetResponse,
    WorkspaceBreadcrumbResponse,
    WorkspaceItemResponse,
    WorkspaceItemsResponse,
)


@strawberry.type
class User:
    """Authenticated user and owner/collaborator summary."""

    id: strawberry.ID
    email: str
    name: str
    initials: str | None
    avatar_color: str | None
    created_at: str | None = None
    updated_at: str | None = None


@strawberry.type
class AuthSession:
    """GraphQL auth session containing a bearer token and user."""

    token: str
    user: User


@strawberry.type
class WorkspaceOwner:
    """Owner metadata nested under workspace item responses."""

    id: strawberry.ID
    name: str
    email: str | None
    initials: str | None
    avatar_color: str | None


@strawberry.type
class Collaborator:
    """Direct collaborator metadata nested under workspace item responses."""

    id: strawberry.ID
    user_id: strawberry.ID
    name: str
    email: str
    initials: str
    avatar_color: str
    role: str
    permission: str
    created_at: str
    updated_at: str


@strawberry.type
class WorkspaceItem:
    """Workspace item fields queried by the frontend GraphQL workspace client."""

    id: strawberry.ID
    kind: str
    type: str
    name: str
    title: str
    parent_id: strawberry.ID | None
    owner: WorkspaceOwner
    owner_id: strawberry.ID
    owner_name: str
    owner_email: str
    current_user_role: str
    permission: str
    sharing_status: str
    visibility: str
    can_edit: bool
    can_write: bool
    can_share: bool
    can_manage: bool
    can_delete: bool
    collaborators: list[Collaborator]
    created_at: str
    updated_at: str
    revision: int | None = None
    last_opened_at: str | None = None
    child_count: int | None = None


@strawberry.type
class WorkspaceBreadcrumb:
    """Folder breadcrumb segment."""

    id: strawberry.ID | None
    name: str


@strawberry.type
class WorkspaceItems:
    """Workspace folder listing payload."""

    folder_id: strawberry.ID | None
    parent_id: strawberry.ID | None
    breadcrumbs: list[WorkspaceBreadcrumb]
    items: list[WorkspaceItem]


@strawberry.type
class MoveTarget:
    """GraphQL move destination entry."""

    id: strawberry.ID | None
    name: str
    path: str
    can_move_here: bool


@strawberry.type
class DocumentContent:
    """GraphQL document content and revision payload."""

    document_id: strawberry.ID
    document: WorkspaceItem
    content: JSON
    revision: int
    can_write: bool
    updated_at: str


@strawberry.type
class CollaborationTransformCaseCounts:
    """GraphQL counters for pairwise OT transform cases."""

    insert_insert: int
    insert_delete: int
    delete_insert: int
    delete_delete: int


@strawberry.type
class CollaborationMetrics:
    """GraphQL collaboration metrics for one document."""

    document_id: strawberry.ID
    version: int
    content_length: int
    total_operations_sent: int
    acknowledged_operations: int
    remote_operations_received: int
    transformed_operations: int
    transform_case_counts: CollaborationTransformCaseCounts
    avg_ack_latency_ms: float | None
    avg_server_processing_ms: float | None
    divergence_events: int
    last_operation_at: str | None


@strawberry.type
class CollaborationHashCheck:
    """GraphQL hash comparison result for divergence detection."""

    document_id: strawberry.ID
    version: int
    client_version: int
    server_hash: str
    client_hash: str
    in_sync: bool
    version_matches: bool
    hash_matches: bool
    checked_at: str


@strawberry.type
class CollaborationSnapshot:
    """GraphQL plain-text collaboration snapshot for resync."""

    document_id: strawberry.ID
    content: str
    version: int
    hash: str
    can_write: bool
    updated_at: str


@strawberry.type
class DeleteResult:
    """Mutation response for delete/no-op commands."""

    success: bool


@strawberry.input(name="RegisterInput")
class RegisterInput:
    """GraphQL registration input used by the frontend."""

    name: str
    email: str
    password: str
    avatar_color: str | None = None


@strawberry.input(name="LoginInput")
class LoginInput:
    """GraphQL login input used by the frontend."""

    email: str
    password: str


@strawberry.input(name="SignUpInput")
class SignUpInput(RegisterInput):
    """Alias registration input for generic GraphQL clients."""


@strawberry.input(name="SignInInput")
class SignInInput(LoginInput):
    """Alias login input for generic GraphQL clients."""


@strawberry.input
class CreateFolderInput:
    """GraphQL folder creation input."""

    name: str
    parent_id: strawberry.ID | None = None


@strawberry.input
class CreateDocumentInput:
    """GraphQL document creation input."""

    name: str
    parent_id: strawberry.ID | None = None


@strawberry.input
class RenameWorkspaceItemInput:
    """GraphQL rename input."""

    item_id: strawberry.ID
    name: str


@strawberry.input
class MoveWorkspaceItemInput:
    """GraphQL move input."""

    item_id: strawberry.ID
    target_folder_id: strawberry.ID | None = None


@strawberry.input
class ShareWorkspaceItemInput:
    """GraphQL sharing input."""

    item_id: strawberry.ID
    email: str
    permission: str


@strawberry.input
class UpdateWorkspaceCollaboratorInput:
    """GraphQL collaborator permission update input."""

    item_id: strawberry.ID
    user_id: strawberry.ID
    permission: str


@strawberry.input
class RemoveWorkspaceCollaboratorInput:
    """GraphQL collaborator removal input."""

    item_id: strawberry.ID
    user_id: strawberry.ID


@strawberry.input
class UpdateDocumentContentInput:
    """GraphQL document content save input."""

    document_id: strawberry.ID
    content: JSON
    revision: int | None = None
    title: str | None = None
    name: str | None = None


def to_gql_user(response: AuthUserResponse) -> User:
    """Map a Pydantic user response into a GraphQL user type."""

    return User(
        id=strawberry.ID(response.id),
        email=response.email,
        name=response.name,
        initials=response.initials,
        avatar_color=response.avatar_color,
        created_at=response.created_at,
        updated_at=response.updated_at,
    )


def to_gql_auth_session(response: AuthSessionResponse) -> AuthSession:
    """Map a Pydantic auth session into a GraphQL auth session."""

    return AuthSession(token=response.token, user=to_gql_user(response.user))


def to_gql_collaborator(response: CollaboratorResponse) -> Collaborator:
    """Map collaborator metadata into GraphQL output."""

    return Collaborator(
        id=strawberry.ID(response.id),
        user_id=strawberry.ID(response.user_id),
        name=response.name,
        email=response.email,
        initials=response.initials,
        avatar_color=response.avatar_color,
        role=response.role,
        permission=response.permission,
        created_at=response.created_at,
        updated_at=response.updated_at,
    )


def to_gql_workspace_item(response: WorkspaceItemResponse) -> WorkspaceItem:
    """Map workspace item metadata into GraphQL output."""

    return WorkspaceItem(
        id=strawberry.ID(response.id),
        kind=response.kind,
        type=response.type,
        name=response.name,
        title=response.title,
        parent_id=strawberry.ID(response.parent_id) if response.parent_id else None,
        owner=WorkspaceOwner(
            id=strawberry.ID(response.owner.id),
            name=response.owner.name,
            email=response.owner.email,
            initials=response.owner.initials,
            avatar_color=response.owner.avatar_color,
        ),
        owner_id=strawberry.ID(response.owner_id),
        owner_name=response.owner_name,
        owner_email=response.owner_email,
        current_user_role=response.current_user_role,
        permission=response.permission,
        sharing_status=response.sharing_status,
        visibility=response.visibility,
        can_edit=response.can_edit,
        can_write=response.can_write,
        can_share=response.can_share,
        can_manage=response.can_manage,
        can_delete=response.can_delete,
        collaborators=[to_gql_collaborator(collaborator) for collaborator in response.collaborators],
        created_at=response.created_at,
        updated_at=response.updated_at,
        revision=response.revision,
        last_opened_at=response.last_opened_at,
        child_count=response.child_count,
    )


def to_gql_workspace_items(response: WorkspaceItemsResponse) -> WorkspaceItems:
    """Map folder listing payload into GraphQL output."""

    return WorkspaceItems(
        folder_id=strawberry.ID(response.folder_id) if response.folder_id else None,
        parent_id=strawberry.ID(response.parent_id) if response.parent_id else None,
        breadcrumbs=[to_gql_breadcrumb(item) for item in response.breadcrumbs],
        items=[to_gql_workspace_item(item) for item in response.items],
    )


def to_gql_breadcrumb(response: WorkspaceBreadcrumbResponse) -> WorkspaceBreadcrumb:
    """Map breadcrumb segment into GraphQL output."""

    return WorkspaceBreadcrumb(
        id=strawberry.ID(response.id) if response.id else None,
        name=response.name,
    )


def to_gql_move_target(response: MoveTargetResponse) -> MoveTarget:
    """Map move target payload into GraphQL output."""

    return MoveTarget(
        id=strawberry.ID(response.id) if response.id else None,
        name=response.name,
        path=response.path,
        can_move_here=response.can_move_here,
    )


def to_gql_document_content(response: DocumentContentResponse) -> DocumentContent:
    """Map document content payload into GraphQL output."""

    return DocumentContent(
        document_id=strawberry.ID(response.document_id),
        document=to_gql_workspace_item(response.document),
        content=response.content,
        revision=response.revision,
        can_write=response.can_write,
        updated_at=response.updated_at,
    )


def to_gql_collaboration_metrics(response: CollaborationMetricsResponse) -> CollaborationMetrics:
    """Map collaboration metrics into a GraphQL output type."""

    return CollaborationMetrics(
        document_id=strawberry.ID(response.document_id),
        version=response.version,
        content_length=response.content_length,
        total_operations_sent=response.total_operations_sent,
        acknowledged_operations=response.acknowledged_operations,
        remote_operations_received=response.remote_operations_received,
        transformed_operations=response.transformed_operations,
        transform_case_counts=CollaborationTransformCaseCounts(
            insert_insert=response.transform_case_counts.insert_insert,
            insert_delete=response.transform_case_counts.insert_delete,
            delete_insert=response.transform_case_counts.delete_insert,
            delete_delete=response.transform_case_counts.delete_delete,
        ),
        avg_ack_latency_ms=response.avg_ack_latency_ms,
        avg_server_processing_ms=response.avg_server_processing_ms,
        divergence_events=response.divergence_events,
        last_operation_at=response.last_operation_at,
    )


def to_gql_collaboration_hash_check(
    response: CollaborationHashCheckResponse,
) -> CollaborationHashCheck:
    """Map a hash-check response into a GraphQL output type."""

    return CollaborationHashCheck(
        document_id=strawberry.ID(response.document_id),
        version=response.version,
        client_version=response.client_version,
        server_hash=response.server_hash,
        client_hash=response.client_hash,
        in_sync=response.in_sync,
        version_matches=response.version_matches,
        hash_matches=response.hash_matches,
        checked_at=response.checked_at,
    )


def to_gql_collaboration_snapshot(response: CollaborationSnapshotResponse) -> CollaborationSnapshot:
    """Map a collaboration snapshot response into a GraphQL output type."""

    return CollaborationSnapshot(
        document_id=strawberry.ID(response.document_id),
        content=response.content,
        version=response.version,
        hash=response.hash,
        can_write=response.can_write,
        updated_at=response.updated_at,
    )


def ensure_json_object(value: Any) -> dict[str, Any]:
    """Validate GraphQL JSON values used for document content saves."""

    if not isinstance(value, dict):
        raise ValueError("Document content must be a JSON object.")
    return value
