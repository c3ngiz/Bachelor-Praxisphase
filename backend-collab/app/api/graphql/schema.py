"""GraphQL schema and resolvers reusing the shared domain services."""

from __future__ import annotations

from typing import Awaitable, Callable, TypeVar

import strawberry
from graphql import GraphQLError
from strawberry.fastapi import GraphQLRouter

from app.api.graphql.context import GraphQLContext, get_graphql_context
from app.api.graphql.types import (
    AuthSession,
    Collaborator,
    CreateDocumentInput,
    CreateFolderInput,
    DeleteResult,
    DocumentContent,
    LoginInput,
    MoveTarget,
    MoveWorkspaceItemInput,
    RegisterInput,
    RemoveWorkspaceCollaboratorInput,
    RenameWorkspaceItemInput,
    ShareWorkspaceItemInput,
    SignInInput,
    SignUpInput,
    UpdateDocumentContentInput,
    UpdateWorkspaceCollaboratorInput,
    User,
    WorkspaceItem,
    WorkspaceItems,
    ensure_json_object,
    to_gql_auth_session,
    to_gql_document_content,
    to_gql_move_target,
    to_gql_user,
    to_gql_workspace_item,
    to_gql_workspace_items,
)
from app.core.config import get_settings
from app.core.errors import AppError
from app.core.security import SecurityService
from app.domain.auth.schemas import LoginRequest, RegisterRequest
from app.domain.auth.service import AuthService
from app.domain.documents.schemas import UpdateDocumentContentRequest
from app.domain.documents.service import DocumentsService
from app.domain.users.service import UsersService
from app.domain.workspace.schemas import (
    CreateDocumentRequest,
    CreateFolderRequest,
    MoveWorkspaceItemRequest,
    RenameWorkspaceItemRequest,
    ShareWorkspaceItemRequest,
)
from app.domain.workspace.service import WorkspaceService

T = TypeVar("T")


@strawberry.type
class Query:
    """Authenticated GraphQL queries for users, workspace, and documents."""

    @strawberry.field
    async def me(self, info: strawberry.Info[GraphQLContext, None]) -> User:
        """Return the current authenticated user."""

        return await guard(lambda: resolve_me(info))

    @strawberry.field
    async def workspace_items(
        self, info: strawberry.Info[GraphQLContext, None], parent_id: strawberry.ID | None = None
    ) -> WorkspaceItems:
        """List root items or direct children of a folder."""

        return await guard(lambda: resolve_workspace_items(info, parent_id))

    @strawberry.field
    async def workspace_item(
        self, info: strawberry.Info[GraphQLContext, None], id: strawberry.ID
    ) -> WorkspaceItem:
        """Return one accessible workspace item."""

        return await guard(lambda: resolve_workspace_item(info, id))

    @strawberry.field
    async def item_collaborators(
        self, info: strawberry.Info[GraphQLContext, None], item_id: strawberry.ID
    ) -> list[Collaborator]:
        """List direct collaborators on an accessible item."""

        return await guard(lambda: resolve_item_collaborators(info, item_id))

    @strawberry.field
    async def move_targets(
        self, info: strawberry.Info[GraphQLContext, None], exclude_item_id: strawberry.ID
    ) -> list[MoveTarget]:
        """List valid destination folders for a move operation."""

        return await guard(lambda: resolve_move_targets(info, exclude_item_id))

    @strawberry.field
    async def document_content(
        self, info: strawberry.Info[GraphQLContext, None], document_id: strawberry.ID
    ) -> DocumentContent:
        """Load document content, revision, and permission state."""

        return await guard(lambda: resolve_document_content(info, document_id))


@strawberry.type
class Mutation:
    """GraphQL mutations mirroring the REST behavior."""

    @strawberry.mutation
    async def register(
        self, info: strawberry.Info[GraphQLContext, None], input: RegisterInput
    ) -> AuthSession:
        """Register a user through the frontend-compatible mutation name."""

        return await guard(lambda: resolve_register(info, input))

    @strawberry.mutation
    async def login(
        self, info: strawberry.Info[GraphQLContext, None], input: LoginInput
    ) -> AuthSession:
        """Authenticate a user through the frontend-compatible mutation name."""

        return await guard(lambda: resolve_login(info, input))

    @strawberry.mutation
    async def sign_up(
        self, info: strawberry.Info[GraphQLContext, None], input: SignUpInput
    ) -> AuthSession:
        """Generic sign-up alias for non-frontend clients."""

        return await guard(lambda: resolve_register(info, input))

    @strawberry.mutation
    async def sign_in(
        self, info: strawberry.Info[GraphQLContext, None], input: SignInInput
    ) -> AuthSession:
        """Generic sign-in alias for non-frontend clients."""

        return await guard(lambda: resolve_login(info, input))

    @strawberry.mutation
    async def sign_out(self, info: strawberry.Info[GraphQLContext, None]) -> DeleteResult:
        """No-op sign-out mutation for bearer-token clients."""

        await guard(lambda: resolve_me(info))
        return DeleteResult(success=True)

    @strawberry.mutation
    async def create_folder(
        self, info: strawberry.Info[GraphQLContext, None], input: CreateFolderInput
    ) -> WorkspaceItem:
        """Create a folder in root or inside a writable folder."""

        return await guard(lambda: resolve_create_folder(info, input))

    @strawberry.mutation
    async def create_document(
        self, info: strawberry.Info[GraphQLContext, None], input: CreateDocumentInput
    ) -> WorkspaceItem:
        """Create a document shell and content row."""

        return await guard(lambda: resolve_create_document(info, input))

    @strawberry.mutation
    async def rename_workspace_item(
        self, info: strawberry.Info[GraphQLContext, None], input: RenameWorkspaceItemInput
    ) -> WorkspaceItem:
        """Rename a workspace item."""

        return await guard(lambda: resolve_rename_workspace_item(info, input))

    @strawberry.mutation
    async def move_workspace_item(
        self, info: strawberry.Info[GraphQLContext, None], input: MoveWorkspaceItemInput
    ) -> WorkspaceItem:
        """Move a workspace item."""

        return await guard(lambda: resolve_move_workspace_item(info, input))

    @strawberry.mutation
    async def delete_workspace_item(
        self, info: strawberry.Info[GraphQLContext, None], id: strawberry.ID
    ) -> DeleteResult:
        """Soft-delete an item and descendants."""

        return await guard(lambda: resolve_delete_workspace_item(info, id))

    @strawberry.mutation
    async def share_workspace_item(
        self, info: strawberry.Info[GraphQLContext, None], input: ShareWorkspaceItemInput
    ) -> WorkspaceItem:
        """Share an item with an existing user."""

        return await guard(lambda: resolve_share_workspace_item(info, input))

    @strawberry.mutation
    async def update_workspace_collaborator(
        self, info: strawberry.Info[GraphQLContext, None], input: UpdateWorkspaceCollaboratorInput
    ) -> WorkspaceItem:
        """Update direct collaborator permission."""

        return await guard(lambda: resolve_update_workspace_collaborator(info, input))

    @strawberry.mutation
    async def remove_workspace_collaborator(
        self, info: strawberry.Info[GraphQLContext, None], input: RemoveWorkspaceCollaboratorInput
    ) -> WorkspaceItem:
        """Remove direct collaborator access."""

        return await guard(lambda: resolve_remove_workspace_collaborator(info, input))

    @strawberry.mutation
    async def update_document_content(
        self, info: strawberry.Info[GraphQLContext, None], input: UpdateDocumentContentInput
    ) -> DocumentContent:
        """Save document content and increment its revision."""

        return await guard(lambda: resolve_update_document_content(info, input))


async def resolve_me(info: strawberry.Info[GraphQLContext, None]) -> User:
    """Resolver implementation for `me`."""

    current_user = await info.context.current_user()
    return to_gql_user(UsersService(info.context.db).to_user_response(current_user))


async def resolve_register(
    info: strawberry.Info[GraphQLContext, None], input: RegisterInput | SignUpInput
) -> AuthSession:
    """Resolver implementation for registration mutations."""

    response = await AuthService(
        info.context.db, SecurityService(get_settings())
    ).register(
        RegisterRequest(
            name=input.name,
            email=input.email,
            password=input.password,
            avatar_color=input.avatar_color,
        )
    )
    return to_gql_auth_session(response)


async def resolve_login(
    info: strawberry.Info[GraphQLContext, None], input: LoginInput | SignInInput
) -> AuthSession:
    """Resolver implementation for login mutations."""

    response = await AuthService(info.context.db, SecurityService(get_settings())).login(
        LoginRequest(email=input.email, password=input.password)
    )
    return to_gql_auth_session(response)


async def resolve_workspace_items(
    info: strawberry.Info[GraphQLContext, None], parent_id: strawberry.ID | None
) -> WorkspaceItems:
    """Resolver implementation for folder listings."""

    current_user = await info.context.current_user()
    response = await WorkspaceService(info.context.db).list_items(
        str(current_user.id), str(parent_id) if parent_id else None
    )
    return to_gql_workspace_items(response)


async def resolve_workspace_item(
    info: strawberry.Info[GraphQLContext, None], item_id: strawberry.ID
) -> WorkspaceItem:
    """Resolver implementation for a single workspace item."""

    current_user = await info.context.current_user()
    response = await WorkspaceService(info.context.db).get_item(str(current_user.id), str(item_id))
    return to_gql_workspace_item(response)


async def resolve_item_collaborators(
    info: strawberry.Info[GraphQLContext, None], item_id: strawberry.ID
) -> list[Collaborator]:
    """Resolver implementation for direct collaborator listings."""

    current_user = await info.context.current_user()
    collaborators = await WorkspaceService(info.context.db).list_collaborators(
        str(current_user.id), str(item_id)
    )
    from app.api.graphql.types import to_gql_collaborator

    return [to_gql_collaborator(collaborator) for collaborator in collaborators]


async def resolve_move_targets(
    info: strawberry.Info[GraphQLContext, None], exclude_item_id: strawberry.ID
) -> list[MoveTarget]:
    """Resolver implementation for move target listings."""

    current_user = await info.context.current_user()
    targets = await WorkspaceService(info.context.db).list_move_targets(
        str(current_user.id), str(exclude_item_id)
    )
    return [to_gql_move_target(target) for target in targets]


async def resolve_document_content(
    info: strawberry.Info[GraphQLContext, None], document_id: strawberry.ID
) -> DocumentContent:
    """Resolver implementation for document content loading."""

    current_user = await info.context.current_user()
    response = await DocumentsService(info.context.db).get_content(
        str(current_user.id), str(document_id)
    )
    return to_gql_document_content(response)


async def resolve_create_folder(
    info: strawberry.Info[GraphQLContext, None], input: CreateFolderInput
) -> WorkspaceItem:
    """Resolver implementation for folder creation."""

    current_user = await info.context.current_user()
    response = await WorkspaceService(info.context.db).create_folder(
        str(current_user.id),
        CreateFolderRequest(name=input.name, parent_id=str(input.parent_id) if input.parent_id else None),
    )
    return to_gql_workspace_item(response)


async def resolve_create_document(
    info: strawberry.Info[GraphQLContext, None], input: CreateDocumentInput
) -> WorkspaceItem:
    """Resolver implementation for document creation."""

    current_user = await info.context.current_user()
    response = await WorkspaceService(info.context.db).create_document(
        str(current_user.id),
        CreateDocumentRequest(
            name=input.name, parent_id=str(input.parent_id) if input.parent_id else None
        ),
    )
    return to_gql_workspace_item(response)


async def resolve_rename_workspace_item(
    info: strawberry.Info[GraphQLContext, None], input: RenameWorkspaceItemInput
) -> WorkspaceItem:
    """Resolver implementation for item rename."""

    current_user = await info.context.current_user()
    response = await WorkspaceService(info.context.db).rename_item(
        str(current_user.id),
        str(input.item_id),
        RenameWorkspaceItemRequest(name=input.name),
    )
    return to_gql_workspace_item(response)


async def resolve_move_workspace_item(
    info: strawberry.Info[GraphQLContext, None], input: MoveWorkspaceItemInput
) -> WorkspaceItem:
    """Resolver implementation for moving an item."""

    current_user = await info.context.current_user()
    response = await WorkspaceService(info.context.db).move_item(
        str(current_user.id),
        str(input.item_id),
        MoveWorkspaceItemRequest(
            target_folder_id=str(input.target_folder_id) if input.target_folder_id else None
        ),
    )
    return to_gql_workspace_item(response)


async def resolve_delete_workspace_item(
    info: strawberry.Info[GraphQLContext, None], item_id: strawberry.ID
) -> DeleteResult:
    """Resolver implementation for item deletion."""

    current_user = await info.context.current_user()
    await WorkspaceService(info.context.db).delete_item(str(current_user.id), str(item_id))
    return DeleteResult(success=True)


async def resolve_share_workspace_item(
    info: strawberry.Info[GraphQLContext, None], input: ShareWorkspaceItemInput
) -> WorkspaceItem:
    """Resolver implementation for item sharing."""

    current_user = await info.context.current_user()
    response = await WorkspaceService(info.context.db).share_item(
        str(current_user.id),
        str(input.item_id),
        ShareWorkspaceItemRequest(email=input.email, permission=input.permission),
    )
    return to_gql_workspace_item(response)


async def resolve_update_workspace_collaborator(
    info: strawberry.Info[GraphQLContext, None], input: UpdateWorkspaceCollaboratorInput
) -> WorkspaceItem:
    """Resolver implementation for collaborator permission updates."""

    current_user = await info.context.current_user()
    response = await WorkspaceService(info.context.db).update_collaborator(
        str(current_user.id), str(input.item_id), str(input.user_id), input.permission
    )
    return to_gql_workspace_item(response)


async def resolve_remove_workspace_collaborator(
    info: strawberry.Info[GraphQLContext, None], input: RemoveWorkspaceCollaboratorInput
) -> WorkspaceItem:
    """Resolver implementation for collaborator removal."""

    current_user = await info.context.current_user()
    response = await WorkspaceService(info.context.db).remove_collaborator(
        str(current_user.id), str(input.item_id), str(input.user_id)
    )
    return to_gql_workspace_item(response)


async def resolve_update_document_content(
    info: strawberry.Info[GraphQLContext, None], input: UpdateDocumentContentInput
) -> DocumentContent:
    """Resolver implementation for document content saves."""

    current_user = await info.context.current_user()
    response = await DocumentsService(info.context.db).update_content(
        str(current_user.id),
        str(input.document_id),
        UpdateDocumentContentRequest(
            content=ensure_json_object(input.content),
            revision=input.revision,
            title=input.title,
            name=input.name,
        ),
    )
    return to_gql_document_content(response)


async def guard(callback: Callable[[], Awaitable[T]]) -> T:
    """Convert domain errors into GraphQL errors with frontend-friendly extensions."""

    try:
        return await callback()
    except AppError as error:
        raise GraphQLError(
            error.message,
            extensions={
                "code": error.code,
                "statusCode": error.status_code,
                "issues": {"fieldErrors": error.field_errors} if error.field_errors else None,
            },
        ) from error
    except ValueError as error:
        raise GraphQLError(str(error), extensions={"code": "VALIDATION_ERROR", "statusCode": 422}) from error


schema = strawberry.Schema(query=Query, mutation=Mutation)
graphql_router = GraphQLRouter(schema, context_getter=get_graphql_context)
