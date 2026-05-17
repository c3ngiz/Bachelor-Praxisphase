"""Workspace hierarchy, sharing, move validation, and response mapping service."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import case, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.common.datetime import to_iso, utc_now
from app.common.utils import get_avatar_color, get_initials, normalize_email
from app.core.errors import AppError, ConflictAppError, ForbiddenError, NotFoundAppError
from app.db.models.document import DocumentContent
from app.db.models.user import User
from app.db.models.workspace import WorkspaceItem, WorkspaceItemType, WorkspacePermission, WorkspaceShare
from app.domain.users.service import UsersService
from app.domain.workspace.permissions import WorkspaceAccess
from app.domain.workspace.schemas import (
    CollaboratorResponse,
    CreateDocumentRequest,
    CreateFolderRequest,
    MoveTargetResponse,
    MoveWorkspaceItemRequest,
    RenameWorkspaceItemRequest,
    ShareWorkspaceItemRequest,
    WorkspaceBreadcrumbResponse,
    WorkspaceItemResponse,
    WorkspaceItemsResponse,
    WorkspaceUserSummary,
)

DEFAULT_DOCUMENT_CONTENT = {"type": "doc", "content": [{"type": "paragraph"}]}
ITEM_OPTIONS = (
    selectinload(WorkspaceItem.owner),
    selectinload(WorkspaceItem.shares).selectinload(WorkspaceShare.user),
    selectinload(WorkspaceItem.document_content),
)


class WorkspaceService:
    """Implements workspace explorer behavior for both REST and GraphQL."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.users = UsersService(db)

    async def list_items(self, user_id: str, parent_id: str | None) -> WorkspaceItemsResponse:
        """List root items or direct children of an accessible folder."""

        parent_uuid = coerce_optional_uuid(parent_id)

        if parent_uuid:
            parent = await self.get_accessible_record(user_id, str(parent_uuid))
            self.assert_folder(parent, code="FOLDER_NOT_FOUND")
            records = await self.find_children(parent_uuid)
            breadcrumbs = await self.build_breadcrumbs(parent_uuid)
        else:
            records = await self.find_root_visible_items(user_id)
            breadcrumbs = [WorkspaceBreadcrumbResponse(id=None, name="Workspace")]

        items = await self.serialize_accessible_items(user_id, records)
        return WorkspaceItemsResponse(
            folder_id=str(parent_uuid) if parent_uuid else None,
            parent_id=str(parent_uuid) if parent_uuid else None,
            breadcrumbs=breadcrumbs,
            items=items,
        )

    async def get_item(self, user_id: str, item_id: str) -> WorkspaceItemResponse:
        """Return a single accessible workspace item."""

        item = await self.get_accessible_record(user_id, item_id)
        access = await self.resolve_access_or_throw(user_id, item)
        return await self.to_workspace_item_response(item, access)

    async def create_folder(self, user_id: str, input: CreateFolderRequest) -> WorkspaceItemResponse:
        """Create a folder in root or under a writable folder."""

        return await self.create_item(user_id, input.name, input.parent_id, WorkspaceItemType.FOLDER)

    async def create_document(
        self, user_id: str, input: CreateDocumentRequest
    ) -> WorkspaceItemResponse:
        """Create a document shell with a JSON content row."""

        return await self.create_item(user_id, input.name, input.parent_id, WorkspaceItemType.DOCUMENT)

    async def create_item(
        self,
        user_id: str,
        name: str,
        parent_id: str | None,
        item_type: WorkspaceItemType,
    ) -> WorkspaceItemResponse:
        """Create a workspace item after parent permission and duplicate checks."""

        normalized_name = normalize_item_name(name)
        parent_uuid = coerce_optional_uuid(parent_id)
        user_uuid = coerce_uuid(user_id)
        await self.assert_writable_parent(user_id, str(parent_uuid) if parent_uuid else None)
        await self.assert_name_available(
            name=normalized_name, owner_id=user_uuid, parent_id=parent_uuid
        )

        item = WorkspaceItem(
            name=normalized_name,
            owner_id=user_uuid,
            parent_id=parent_uuid,
            type=item_type,
        )
        self.db.add(item)
        await self.db.flush()

        if item_type == WorkspaceItemType.DOCUMENT:
            self.db.add(DocumentContent(item_id=item.id, content=DEFAULT_DOCUMENT_CONTENT))

        await self.db.commit()
        return await self.get_item(user_id, str(item.id))

    async def rename_item(
        self, user_id: str, item_id: str, input: RenameWorkspaceItemRequest | str
    ) -> WorkspaceItemResponse:
        """Rename a folder or document when the user has write access."""

        item = await self.get_accessible_record(user_id, item_id)
        access = await self.resolve_access(user_id, item)
        self.assert_can_write(access)
        name = input if isinstance(input, str) else input.name
        next_name = normalize_item_name(name)
        await self.assert_name_available(
            name=next_name,
            owner_id=item.owner_id,
            parent_id=item.parent_id,
            exclude_item_id=item.id,
        )
        item.name = next_name
        item.updated_at = utc_now()
        await self.db.commit()
        return await self.get_item(user_id, str(item.id))

    async def delete_item(self, user_id: str, item_id: str) -> None:
        """Soft-delete an item and all descendants. Only owners may delete."""

        item = await self.get_accessible_record(user_id, item_id)
        access = await self.resolve_access_or_throw(user_id, item)

        if access.permission != "owner":
            raise ForbiddenError("Only the owner can delete this item.")

        descendant_ids = await self.collect_descendant_ids(item.id)
        deleted_at = utc_now()
        await self.db.execute(
            update(WorkspaceItem)
            .where(WorkspaceItem.id.in_([item.id, *descendant_ids]))
            .values(deleted_at=deleted_at, updated_at=deleted_at)
        )
        await self.db.commit()

    async def list_move_targets(self, user_id: str, exclude_item_id: str) -> list[MoveTargetResponse]:
        """List writable folder destinations while preventing recursive moves."""

        item = await self.get_accessible_record(user_id, exclude_item_id)
        self.assert_can_write(await self.resolve_access(user_id, item))
        folders = await self.find_all_folders()
        targets = [
            MoveTargetResponse(
                id=None,
                name="Workspace",
                path="Workspace",
                can_move_here=item.parent_id is not None,
            )
        ]

        for folder in folders:
            if item.type == WorkspaceItemType.FOLDER and (
                folder.id == item.id or await self.is_descendant_of(folder.id, item.id)
            ):
                continue

            access = await self.resolve_access(user_id, folder)

            if access and access.can_write:
                targets.append(
                    MoveTargetResponse(
                        id=str(folder.id),
                        name=folder.name,
                        path=await self.build_path_label(folder.id),
                        can_move_here=folder.id != item.parent_id,
                    )
                )

        return sorted(targets, key=lambda target: target.path)

    async def move_item(
        self, user_id: str, item_id: str, input: MoveWorkspaceItemRequest | str | None
    ) -> WorkspaceItemResponse:
        """Move an item to root or a writable folder with cycle validation."""

        target_folder_id = input.target_folder_id if isinstance(input, MoveWorkspaceItemRequest) else input
        target_uuid = coerce_optional_uuid(target_folder_id)
        item = await self.get_accessible_record(user_id, item_id)
        self.assert_can_write(await self.resolve_access(user_id, item))

        if target_uuid:
            target = await self.get_accessible_record(user_id, str(target_uuid))
            self.assert_folder(target, code="FOLDER_NOT_FOUND")
            self.assert_can_write(await self.resolve_access(user_id, target))

            if item.type == WorkspaceItemType.FOLDER and (
                item.id == target.id or await self.is_descendant_of(target.id, item.id)
            ):
                raise ConflictAppError(
                    "A folder cannot be moved into itself or one of its descendants.",
                    code="INVALID_MOVE_TARGET",
                )

        await self.assert_name_available(
            name=item.name,
            owner_id=item.owner_id,
            parent_id=target_uuid,
            exclude_item_id=item.id,
        )
        item.parent_id = target_uuid
        item.updated_at = utc_now()
        await self.db.commit()
        return await self.get_item(user_id, str(item.id))

    async def share_item(
        self, user_id: str, item_id: str, input: ShareWorkspaceItemRequest
    ) -> WorkspaceItemResponse:
        """Share an item with an existing user by email. Only owners may share."""

        item = await self.get_accessible_record(user_id, item_id)
        await self.assert_owner(user_id, item)
        collaborator = await self.users.find_by_email(normalize_email(str(input.email)))

        if not collaborator:
            raise NotFoundAppError("No user with that email exists.", code="USER_NOT_FOUND")

        if collaborator.id == item.owner_id:
            raise ConflictAppError(
                "The owner already has full access.", code="OWNER_CANNOT_BE_SHARED"
            )

        if await self.find_direct_share(item.id, collaborator.id):
            raise ConflictAppError(
                "This user is already a collaborator.", code="COLLABORATOR_ALREADY_EXISTS"
            )

        self.db.add(
            WorkspaceShare(
                item_id=item.id,
                user_id=collaborator.id,
                permission=to_db_permission(input.permission),
            )
        )
        item.updated_at = utc_now()
        await self.db.commit()
        return await self.get_item(user_id, str(item.id))

    async def list_collaborators(self, user_id: str, item_id: str) -> list[CollaboratorResponse]:
        """List direct collaborators on an accessible item."""

        item = await self.get_accessible_record(user_id, item_id)
        return [self.to_collaborator_response(share) for share in item.shares]

    async def update_collaborator(
        self, user_id: str, item_id: str, collaborator_id: str, permission: str
    ) -> WorkspaceItemResponse:
        """Update a direct collaborator permission. Only owners may update."""

        item = await self.get_accessible_record(user_id, item_id)
        await self.assert_owner(user_id, item)
        share = await self.get_share_or_throw(item.id, coerce_uuid(collaborator_id))
        share.permission = to_db_permission(permission)
        item.updated_at = utc_now()
        await self.db.commit()
        return await self.get_item(user_id, str(item.id))

    async def remove_collaborator(
        self, user_id: str, item_id: str, collaborator_id: str
    ) -> WorkspaceItemResponse:
        """Remove direct collaborator access. Owners cannot be removed or downgraded."""

        item = await self.get_accessible_record(user_id, item_id)
        await self.assert_owner(user_id, item)
        share = await self.get_share_or_throw(item.id, coerce_uuid(collaborator_id))
        await self.db.delete(share)
        item.updated_at = utc_now()
        await self.db.commit()
        return await self.get_item(user_id, str(item.id))

    async def search_items(self, user_id: str, query: str) -> WorkspaceItemsResponse:
        """Search visible item names for optional explorer integrations."""

        normalized = query.strip()

        if len(normalized) < 2:
            return WorkspaceItemsResponse(folder_id=None, parent_id=None, breadcrumbs=[], items=[])

        result = await self.db.execute(
            select(WorkspaceItem)
            .options(*ITEM_OPTIONS)
            .where(WorkspaceItem.deleted_at.is_(None), WorkspaceItem.name.ilike(f"%{normalized}%"))
            .order_by(WorkspaceItem.name.asc())
            .limit(50)
        )
        items = await self.serialize_accessible_items(user_id, list(result.scalars().all()))
        return WorkspaceItemsResponse(
            folder_id=None,
            parent_id=None,
            breadcrumbs=[WorkspaceBreadcrumbResponse(id=None, name="Workspace")],
            items=items,
        )

    async def get_accessible_record(self, user_id: str, item_id: str) -> WorkspaceItem:
        """Load an item and confirm the user has effective read access."""

        item = await self.find_record_by_id(coerce_uuid(item_id))

        if not item:
            raise NotFoundAppError("Workspace item not found.", code="ITEM_NOT_FOUND")

        if not await self.resolve_access(user_id, item):
            raise ForbiddenError("You do not have access to this item.")

        return item

    async def assert_can_write_item(self, user_id: str, item_id: str) -> WorkspaceItem:
        """Load an accessible item and assert write permission."""

        item = await self.get_accessible_record(user_id, item_id)
        self.assert_can_write(await self.resolve_access(user_id, item))
        return item

    async def resolve_access(self, user_id: str, item: WorkspaceItem) -> WorkspaceAccess | None:
        """Resolve effective access from owner, direct item share, and folder ancestors."""

        if str(item.owner_id) == str(user_id):
            return WorkspaceAccess(permission="owner", direct=False)

        best_permission: str | None = None
        direct = False
        user_uuid = coerce_uuid(user_id)
        direct_share = next((share for share in item.shares if share.user_id == user_uuid), None)

        if direct_share:
            best_permission = max_permission(best_permission, direct_share.permission)
            direct = True

        for ancestor in await self.load_ancestors_for_access(item.parent_id):
            if str(ancestor.owner_id) == str(user_id):
                best_permission = max_permission(best_permission, WorkspacePermission.WRITE)
                continue

            inherited_permission = await self.load_direct_permission(user_uuid, ancestor.id)
            best_permission = max_permission(best_permission, inherited_permission)

        return WorkspaceAccess(permission=best_permission, direct=direct) if best_permission else None

    async def resolve_access_or_throw(self, user_id: str, item: WorkspaceItem) -> WorkspaceAccess:
        """Resolve effective access for an already accessible item or raise forbidden."""

        access = await self.resolve_access(user_id, item)

        if not access:
            raise ForbiddenError("You do not have access to this item.")

        return access

    def assert_document(self, item: WorkspaceItem) -> None:
        """Ensure an item is a document before document-content operations."""

        if item.type != WorkspaceItemType.DOCUMENT:
            raise NotFoundAppError("Document not found.", code="DOCUMENT_NOT_FOUND")

    def assert_folder(self, item: WorkspaceItem, *, code: str) -> None:
        """Ensure an item is a folder before hierarchy operations."""

        if item.type != WorkspaceItemType.FOLDER:
            raise NotFoundAppError("Folder not found.", code=code)

    async def find_record_by_id(self, item_id: UUID) -> WorkspaceItem | None:
        """Find an active workspace item by id with response relationships loaded."""

        result = await self.db.execute(
            select(WorkspaceItem)
            .options(*ITEM_OPTIONS)
            .where(WorkspaceItem.id == item_id, WorkspaceItem.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def find_children(self, parent_id: UUID) -> list[WorkspaceItem]:
        """Find direct active children for a folder."""

        result = await self.db.execute(
            select(WorkspaceItem)
            .options(*ITEM_OPTIONS)
            .where(WorkspaceItem.parent_id == parent_id, WorkspaceItem.deleted_at.is_(None))
            .order_by(folder_first_order(), WorkspaceItem.name.asc())
        )
        return list(result.scalars().all())

    async def find_root_visible_items(self, user_id: str) -> list[WorkspaceItem]:
        """Find owned root items and directly shared items visible in root listing."""

        user_uuid = coerce_uuid(user_id)
        owned_result = await self.db.execute(
            select(WorkspaceItem)
            .options(*ITEM_OPTIONS)
            .where(
                WorkspaceItem.owner_id == user_uuid,
                WorkspaceItem.parent_id.is_(None),
                WorkspaceItem.deleted_at.is_(None),
            )
            .order_by(folder_first_order(), WorkspaceItem.name.asc())
        )
        shared_result = await self.db.execute(
            select(WorkspaceItem)
            .join(WorkspaceShare, WorkspaceShare.item_id == WorkspaceItem.id)
            .options(*ITEM_OPTIONS)
            .where(
                WorkspaceShare.user_id == user_uuid,
                WorkspaceItem.owner_id != user_uuid,
                WorkspaceItem.deleted_at.is_(None),
            )
            .order_by(folder_first_order(), WorkspaceItem.name.asc())
        )
        by_id = {item.id: item for item in owned_result.scalars().all()}

        for item in shared_result.scalars().all():
            by_id[item.id] = item

        return sorted(by_id.values(), key=lambda item: (item.type != WorkspaceItemType.FOLDER, item.name))

    async def find_all_folders(self) -> list[WorkspaceItem]:
        """Find all active folders for move-target filtering."""

        result = await self.db.execute(
            select(WorkspaceItem)
            .options(*ITEM_OPTIONS)
            .where(WorkspaceItem.deleted_at.is_(None), WorkspaceItem.type == WorkspaceItemType.FOLDER)
            .order_by(WorkspaceItem.name.asc())
        )
        return list(result.scalars().all())

    async def serialize_accessible_items(
        self, user_id: str, records: list[WorkspaceItem]
    ) -> list[WorkspaceItemResponse]:
        """Serialize only records the current user can read."""

        items: list[WorkspaceItemResponse] = []

        for record in records:
            access = await self.resolve_access(user_id, record)
            if access:
                items.append(await self.to_workspace_item_response(record, access))

        return items

    async def assert_writable_parent(self, user_id: str, parent_id: str | None) -> None:
        """Ensure a parent folder exists and is writable when provided."""

        if not parent_id:
            return

        parent = await self.get_accessible_record(user_id, parent_id)
        self.assert_folder(parent, code="FOLDER_NOT_FOUND")
        self.assert_can_write(await self.resolve_access(user_id, parent))

    async def assert_name_available(
        self,
        *,
        name: str,
        owner_id: UUID,
        parent_id: UUID | None,
        exclude_item_id: UUID | None = None,
    ) -> None:
        """Reject duplicate active sibling names in a folder or owned root."""

        filters = [WorkspaceItem.deleted_at.is_(None), WorkspaceItem.name == name]

        if exclude_item_id:
            filters.append(WorkspaceItem.id != exclude_item_id)

        if parent_id:
            filters.append(WorkspaceItem.parent_id == parent_id)
        else:
            filters.extend([WorkspaceItem.parent_id.is_(None), WorkspaceItem.owner_id == owner_id])

        result = await self.db.execute(select(WorkspaceItem.id).where(*filters).limit(1))

        if result.scalar_one_or_none():
            raise ConflictAppError(
                "An item with this name already exists in that folder.",
                code="DUPLICATE_ITEM_NAME",
            )

    def assert_can_write(self, access: WorkspaceAccess | None) -> None:
        """Assert that an access result grants write operations."""

        if not access or not access.can_write:
            raise ForbiddenError("Write permission is required for this item.")

    async def assert_owner(self, user_id: str, item: WorkspaceItem) -> None:
        """Assert that the current user owns an item for management operations."""

        access = await self.resolve_access(user_id, item)

        if access is None or access.permission != "owner":
            raise ForbiddenError("Only the owner can manage sharing for this item.")

    async def find_direct_share(self, item_id: UUID, user_id: UUID) -> WorkspaceShare | None:
        """Find a direct share row for an item and user."""

        result = await self.db.execute(
            select(WorkspaceShare)
            .options(selectinload(WorkspaceShare.user))
            .where(WorkspaceShare.item_id == item_id, WorkspaceShare.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_share_or_throw(self, item_id: UUID, user_id: UUID) -> WorkspaceShare:
        """Find a direct share or raise a collaborator not-found error."""

        share = await self.find_direct_share(item_id, user_id)

        if not share:
            raise NotFoundAppError("Collaborator not found.", code="COLLABORATOR_NOT_FOUND")

        return share

    async def collect_descendant_ids(self, item_id: UUID) -> list[UUID]:
        """Collect all active descendant ids for soft deletion."""

        descendant_ids: list[UUID] = []
        frontier = [item_id]

        while frontier:
            result = await self.db.execute(
                select(WorkspaceItem.id).where(
                    WorkspaceItem.deleted_at.is_(None), WorkspaceItem.parent_id.in_(frontier)
                )
            )
            frontier = list(result.scalars().all())
            descendant_ids.extend(frontier)

        return descendant_ids

    async def is_descendant_of(self, item_id: UUID, ancestor_id: UUID) -> bool:
        """Return whether `item_id` is nested below `ancestor_id`."""

        current_id: UUID | None = item_id
        seen: set[UUID] = set()

        while current_id:
            if current_id == ancestor_id:
                return True
            if current_id in seen:
                return False

            seen.add(current_id)
            result = await self.db.execute(
                select(WorkspaceItem.parent_id).where(
                    WorkspaceItem.id == current_id, WorkspaceItem.deleted_at.is_(None)
                )
            )
            current_id = result.scalar_one_or_none()

        return False

    async def load_ancestors_for_access(self, parent_id: UUID | None) -> list[WorkspaceItem]:
        """Load ancestor folders from nearest parent upward for permission inheritance."""

        ancestors: list[WorkspaceItem] = []
        current_parent_id = parent_id
        seen: set[UUID] = set()

        while current_parent_id and current_parent_id not in seen:
            seen.add(current_parent_id)
            result = await self.db.execute(
                select(WorkspaceItem)
                .options(*ITEM_OPTIONS)
                .where(
                    WorkspaceItem.id == current_parent_id,
                    WorkspaceItem.type == WorkspaceItemType.FOLDER,
                    WorkspaceItem.deleted_at.is_(None),
                )
            )
            ancestor = result.scalar_one_or_none()

            if not ancestor:
                break

            ancestors.append(ancestor)
            current_parent_id = ancestor.parent_id

        return ancestors

    async def load_direct_permission(
        self, user_id: UUID, item_id: UUID
    ) -> WorkspacePermission | None:
        """Load the direct share permission for a user on an item."""

        result = await self.db.execute(
            select(WorkspaceShare.permission).where(
                WorkspaceShare.user_id == user_id, WorkspaceShare.item_id == item_id
            )
        )
        return result.scalar_one_or_none()

    async def build_breadcrumbs(self, folder_id: UUID) -> list[WorkspaceBreadcrumbResponse]:
        """Build a breadcrumb trail from root to the current folder."""

        segments: list[WorkspaceBreadcrumbResponse] = []
        current_id: UUID | None = folder_id
        seen: set[UUID] = set()

        while current_id and current_id not in seen:
            seen.add(current_id)
            result = await self.db.execute(
                select(WorkspaceItem.id, WorkspaceItem.name, WorkspaceItem.parent_id).where(
                    WorkspaceItem.id == current_id,
                    WorkspaceItem.type == WorkspaceItemType.FOLDER,
                    WorkspaceItem.deleted_at.is_(None),
                )
            )
            folder = result.one_or_none()

            if not folder:
                break

            segments.insert(0, WorkspaceBreadcrumbResponse(id=str(folder.id), name=folder.name))
            current_id = folder.parent_id

        return [WorkspaceBreadcrumbResponse(id=None, name="Workspace"), *segments]

    async def build_path_label(self, folder_id: UUID) -> str:
        """Build a slash-separated move target label."""

        breadcrumbs = await self.build_breadcrumbs(folder_id)
        return " / ".join(segment.name for segment in breadcrumbs)

    async def child_count(self, folder_id: UUID) -> int:
        """Count active direct children for folder metadata."""

        result = await self.db.execute(
            select(func.count(WorkspaceItem.id)).where(
                WorkspaceItem.parent_id == folder_id, WorkspaceItem.deleted_at.is_(None)
            )
        )
        return int(result.scalar_one())

    async def to_workspace_item_response(
        self, item: WorkspaceItem, access: WorkspaceAccess
    ) -> WorkspaceItemResponse:
        """Serialize a workspace item into the REST/GraphQL contract."""

        kind = "folder" if item.type == WorkspaceItemType.FOLDER else "document"
        owner = self.to_owner_summary(item.owner)
        can_write = access.can_write
        can_manage = access.can_manage
        collaborators = [self.to_collaborator_response(share) for share in item.shares]
        sharing_status = (
            "shared-with-me"
            if access.permission != "owner"
            else "shared-by-me"
            if collaborators
            else "private"
        )
        document_content = item.document_content

        return WorkspaceItemResponse(
            id=str(item.id),
            kind=kind,
            type=kind,
            name=item.name,
            title=item.name,
            parent_id=str(item.parent_id) if item.parent_id else None,
            owner=owner,
            owner_id=str(item.owner_id),
            owner_name=owner.name,
            owner_email=owner.email or "",
            current_user_role=access.permission,
            permission=access.permission,
            sharing_status=sharing_status,
            visibility="private" if sharing_status == "private" else "shared",
            can_edit=can_write,
            can_write=can_write,
            can_share=can_manage,
            can_manage=can_manage,
            can_delete=can_manage,
            collaborators=collaborators,
            created_at=to_iso(item.created_at) or "",
            updated_at=to_iso(item.updated_at) or "",
            revision=document_content.revision if document_content else None,
            last_opened_at=to_iso(document_content.last_opened_at) if document_content else None,
            child_count=await self.child_count(item.id) if kind == "folder" else None,
        )

    def to_owner_summary(self, user: User) -> WorkspaceUserSummary:
        """Serialize an owner into workspace item metadata."""

        return WorkspaceUserSummary(
            id=str(user.id),
            name=user.name,
            email=user.email,
            initials=get_initials(user.name, user.email),
            avatar_color=user.avatar_color or get_avatar_color(user.email),
        )

    def to_collaborator_response(self, share: WorkspaceShare) -> CollaboratorResponse:
        """Serialize a direct share into collaborator metadata."""

        permission = to_api_permission(share.permission)
        return CollaboratorResponse(
            id=str(share.user_id),
            user_id=str(share.user_id),
            name=share.user.name,
            email=share.user.email,
            initials=get_initials(share.user.name, share.user.email),
            avatar_color=share.user.avatar_color or get_avatar_color(share.user.email),
            role=permission,
            permission=permission,
            created_at=to_iso(share.created_at) or "",
            updated_at=to_iso(share.updated_at) or "",
        )


def coerce_uuid(value: str | UUID) -> UUID:
    """Validate and coerce a user-supplied identifier into a UUID."""

    try:
        return value if isinstance(value, UUID) else UUID(str(value))
    except ValueError as error:
        raise AppError("Identifier must be a valid UUID.", code="INVALID_ID") from error


def coerce_optional_uuid(value: str | UUID | None) -> UUID | None:
    """Coerce blank, null, or UUID string folder ids."""

    if value in {None, ""}:
        return None
    return coerce_uuid(value)


def normalize_item_name(name: str) -> str:
    """Trim and validate workspace item names."""

    value = name.strip()

    if not value:
        raise AppError("Item name is required.", code="INVALID_ITEM_NAME")

    if len(value) > 160:
        raise AppError("Item name must be 160 characters or fewer.", code="INVALID_ITEM_NAME")

    return value


def to_api_permission(permission: WorkspacePermission) -> str:
    """Convert a database share enum into an API permission value."""

    return "write" if permission == WorkspacePermission.WRITE else "read"


def to_db_permission(permission: str) -> WorkspacePermission:
    """Convert an API permission value into the database enum."""

    if permission == "write":
        return WorkspacePermission.WRITE
    if permission == "read":
        return WorkspacePermission.READ
    raise AppError("Permission must be read or write.", code="INVALID_PERMISSION")


def max_permission(current: str | None, next_value: WorkspacePermission | None) -> str | None:
    """Return the strongest non-owner permission."""

    if current == "write" or next_value == WorkspacePermission.WRITE:
        return "write"
    if current == "read" or next_value == WorkspacePermission.READ:
        return "read"
    return None


def folder_first_order():
    """Return a SQL expression that sorts folders before documents."""

    return case((WorkspaceItem.type == WorkspaceItemType.FOLDER, 0), else_=1)
