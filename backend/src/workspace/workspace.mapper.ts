import type { PermissionLevel } from "@prisma/client";
import { getEffectivePermission } from "./workspace.permissions.js";
import { countActiveChildren, findActiveWorkspaceItemById } from "./workspace.repository.js";
import type {
  EffectivePermission,
  MoveTargetResponse,
  WorkspaceBreadcrumbResponse,
  WorkspaceCollaboratorResponse,
  WorkspaceItemResponse,
  WorkspaceItemWithRelations,
  WorkspaceLegacyDocumentResponse,
} from "./workspace.types.js";

/**
 * Maps an item into the frontend workspace contract.
 *
 * @param item - Workspace item with relations.
 * @param userId - Current user id.
 * @returns Normalized workspace item response.
 */
export async function toWorkspaceItemResponse(
  item: WorkspaceItemWithRelations,
  userId: string,
): Promise<WorkspaceItemResponse> {
  const permission = (await getEffectivePermission(item, userId)) ?? "read";
  const directCollaborators = item.collaborators;
  const ownerCollaborator: WorkspaceCollaboratorResponse = {
    avatarColor: item.owner.avatarColor,
    createdAt: item.createdAt.toISOString(),
    email: item.owner.email,
    id: item.ownerId,
    initials: item.owner.initials,
    name: item.owner.name,
    permission: "owner",
    role: "owner",
    updatedAt: item.updatedAt.toISOString(),
    userId: item.ownerId,
  };
  const collaborators = [
    ownerCollaborator,
    ...directCollaborators.map(toWorkspaceCollaboratorResponse),
  ];
  const isOwner = item.ownerId === userId;
  const hasDirectShares = directCollaborators.length > 0;
  const canWrite = permission === "owner" || permission === "write";

  return {
    canDelete: isOwner,
    canEdit: canWrite,
    canManage: isOwner,
    canShare: isOwner,
    canWrite,
    childCount: item.type === "folder" ? await countActiveChildren(item.id) : undefined,
    collaborators,
    createdAt: item.createdAt.toISOString(),
    currentUserRole: permission,
    id: item.id,
    kind: item.type,
    lastOpenedAt: item.document?.lastOpenedAt?.toISOString() ?? null,
    name: item.name,
    owner: item.owner,
    ownerEmail: item.owner.email,
    ownerId: item.ownerId,
    ownerName: item.owner.name,
    parentId: item.parentId,
    permission,
    revision: item.document?.revision,
    sharingStatus: isOwner ? (hasDirectShares ? "shared-by-me" : "private") : "shared-with-me",
    title: item.name,
    type: item.type,
    updatedAt: item.updatedAt.toISOString(),
    visibility: hasDirectShares ? "shared" : "private",
  };
}

/**
 * Maps a direct collaborator record into the frontend collaborator contract.
 *
 * @param collaborator - Direct collaborator relation.
 * @returns Collaborator response.
 */
export function toWorkspaceCollaboratorResponse(
  collaborator: WorkspaceItemWithRelations["collaborators"][number],
): WorkspaceCollaboratorResponse {
  return {
    avatarColor: collaborator.user.avatarColor,
    createdAt: collaborator.createdAt.toISOString(),
    email: collaborator.user.email,
    id: collaborator.userId,
    initials: collaborator.user.initials,
    name: collaborator.user.name,
    permission: collaborator.permission,
    role: collaborator.permission,
    updatedAt: collaborator.updatedAt.toISOString(),
    userId: collaborator.userId,
  };
}

/**
 * Builds breadcrumbs from root to the given folder.
 *
 * @param folder - Current folder item, or null for root.
 * @returns Breadcrumb path.
 */
export async function buildWorkspaceBreadcrumbs(
  folder: WorkspaceItemWithRelations | null,
): Promise<WorkspaceBreadcrumbResponse[]> {
  const breadcrumbs: WorkspaceBreadcrumbResponse[] = [{ id: null, name: "Workspace" }];
  const folders: WorkspaceItemWithRelations[] = [];
  let current = folder;

  while (current) {
    folders.unshift(current);
    current = current.parentId ? await findActiveWorkspaceItemById(current.parentId) : null;
  }

  breadcrumbs.push(...folders.map((item) => ({ id: item.id, name: item.name })));
  return breadcrumbs;
}

/**
 * Builds a slash-separated folder path for move targets.
 *
 * @param folder - Folder item.
 * @returns Human-readable path.
 */
export async function buildFolderPath(folder: WorkspaceItemWithRelations): Promise<string> {
  return (await buildWorkspaceBreadcrumbs(folder)).map((part) => part.name).join(" / ");
}

/**
 * Maps a folder item into a move target.
 *
 * @param folder - Folder candidate.
 * @param canMoveHere - Whether the folder is valid for the current move.
 * @returns Move target response.
 */
export async function toMoveTargetResponse(
  folder: WorkspaceItemWithRelations,
  canMoveHere: boolean,
): Promise<MoveTargetResponse> {
  return {
    canMoveHere,
    id: folder.id,
    name: folder.name,
    path: await buildFolderPath(folder),
  };
}

/**
 * Maps a workspace document item into the older document API contract.
 *
 * @param item - Document workspace item.
 * @param permission - Effective permission for the current user.
 * @returns Legacy document response.
 */
export function toLegacyDocumentResponse(
  item: WorkspaceItemWithRelations,
  permission: Exclude<EffectivePermission, null>,
): WorkspaceLegacyDocumentResponse {
  const canEdit = permission === "owner" || permission === "write";
  const collaborators = [
    {
      color: item.owner.avatarColor,
      id: item.ownerId,
      initials: item.owner.initials,
      name: item.owner.name,
      role: "owner" as const,
    },
    ...item.collaborators.map((collaborator) => ({
      color: collaborator.user.avatarColor,
      id: collaborator.userId,
      initials: collaborator.user.initials,
      name: collaborator.user.name,
      role: toLegacyRole(collaborator.permission),
    })),
  ];

  return {
    author: item.owner.name,
    canDelete: permission === "owner",
    canEdit,
    canShare: permission === "owner",
    collaborators,
    content: item.document?.content ?? { type: "doc", content: [] },
    createdAt: item.createdAt.toISOString(),
    currentUserRole: permission === "owner" ? "owner" : toLegacyRole(permission),
    id: item.id,
    lastEditedAt: item.document?.lastEditedAt.toISOString() ?? item.updatedAt.toISOString(),
    lastEditedById: item.document?.lastEditedById ?? item.ownerId,
    lastEditedByName: item.document?.lastEditedByName ?? item.owner.name,
    lastOpenedAt: item.document?.lastOpenedAt?.toISOString(),
    ownerId: item.ownerId,
    ownerName: item.owner.name,
    revision: item.document?.revision ?? 1,
    title: item.name,
    updatedAt: item.updatedAt.toISOString(),
    visibility: item.collaborators.length > 0 ? "shared" : "private",
    workspaceId: item.parentId ?? "",
  };
}

/**
 * Converts read/write permissions to the old document role vocabulary.
 *
 * @param permission - Canonical permission.
 * @returns Legacy document role.
 */
function toLegacyRole(permission: PermissionLevel): "editor" | "viewer" {
  return permission === "write" ? "editor" : "viewer";
}
