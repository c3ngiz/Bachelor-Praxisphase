import { getAvatarColor, getInitials } from '../common/utils/avatar.util.js';
import type {
  CollaboratorResponse,
  WorkspaceAccess,
  WorkspaceItemResponse,
  WorkspaceOwnerResponse,
  WorkspacePermissionLevel,
  WorkspaceRecord,
  WorkspaceSharePermissionValue,
} from './workspace.types.js';

/**
 * Converts a database permission enum into the frontend permission value.
 *
 * @param permission - Prisma share permission.
 * @returns Frontend permission level.
 */
export function toPermissionLevel(
  permission: WorkspaceSharePermissionValue,
): Exclude<WorkspacePermissionLevel, 'owner'> {
  return permission === 'WRITE' ? 'write' : 'read';
}

/**
 * Converts a frontend permission value into the database enum value.
 *
 * @param permission - Frontend permission value.
 * @returns Prisma share permission.
 */
export function toSharePermission(permission: 'read' | 'write'): WorkspaceSharePermissionValue {
  return permission === 'write' ? 'WRITE' : 'READ';
}

/**
 * Serializes a workspace item into the contract accepted by RestWorkspaceClient.
 *
 * @param item - Workspace item loaded with owner, direct shares, and metadata.
 * @param access - Current user's effective access.
 * @returns Frontend-compatible workspace item.
 */
export function toWorkspaceItemResponse(
  item: WorkspaceRecord,
  access: WorkspaceAccess,
): WorkspaceItemResponse {
  const kind = item.type === 'FOLDER' ? 'folder' : 'document';
  const canWrite = access.permission === 'owner' || access.permission === 'write';
  const canManage = access.permission === 'owner';
  const response: WorkspaceItemResponse = {
    canDelete: canManage,
    canEdit: canWrite,
    canManage,
    canShare: canManage,
    canWrite,
    collaborators: item.shares.map(toCollaboratorResponse),
    createdAt: item.createdAt.toISOString(),
    currentUserRole: access.permission,
    id: item.id,
    kind,
    name: item.name,
    owner: toWorkspaceOwnerResponse(item),
    ownerId: item.ownerId,
    parentId: item.parentId,
    permission: access.permission,
    sharingStatus: getSharingStatus(item, access.permission),
    type: kind,
    updatedAt: item.updatedAt.toISOString(),
  };

  if (kind === 'folder') {
    response.childCount = item._count?.children ?? 0;
  } else {
    response.revision = item.documentContent?.revision ?? 1;
    response.lastOpenedAt = item.documentContent?.lastOpenedAt?.toISOString();
  }

  return response;
}

/**
 * Serializes a direct share into a collaborator response.
 *
 * @param share - Direct workspace share.
 * @returns Frontend-compatible collaborator.
 */
export function toCollaboratorResponse(share: WorkspaceRecord['shares'][number]): CollaboratorResponse {
  return {
    avatarColor: share.user.avatarColor ?? getAvatarColor(share.user.email),
    createdAt: share.createdAt.toISOString(),
    email: share.user.email,
    id: share.userId,
    initials: getInitials(share.user.name, share.user.email),
    name: share.user.name,
    permission: toPermissionLevel(share.permission),
    updatedAt: share.updatedAt.toISOString(),
    userId: share.userId,
  };
}

/**
 * Serializes an item's owner metadata.
 *
 * @param item - Workspace item loaded with owner.
 * @returns Owner summary.
 */
function toWorkspaceOwnerResponse(item: WorkspaceRecord): WorkspaceOwnerResponse {
  return {
    avatarColor: item.owner.avatarColor ?? getAvatarColor(item.owner.email),
    email: item.owner.email,
    id: item.owner.id,
    initials: getInitials(item.owner.name, item.owner.email),
    name: item.owner.name,
  };
}

/**
 * Derives the sharing badge state for the current user.
 *
 * @param item - Workspace item.
 * @param permission - Current user's effective permission.
 * @returns Frontend sharing status.
 */
function getSharingStatus(
  item: WorkspaceRecord,
  permission: WorkspacePermissionLevel,
): WorkspaceItemResponse['sharingStatus'] {
  if (permission !== 'owner') {
    return 'shared-with-me';
  }

  return item.shares.length > 0 ? 'shared-by-me' : 'private';
}
