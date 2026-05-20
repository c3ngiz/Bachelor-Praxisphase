import type {
  Collaborator,
  MoveTarget,
  PermissionLevel,
  SharingStatus,
  WorkspaceBreadcrumb,
  WorkspaceItem,
  WorkspaceItemsResult,
  WorkspaceUserSummary,
} from '../types/workspace.types';

/** Backend role values accepted by the workspace mapper layer. */
export type BackendWorkspaceRole = 'owner' | 'editor' | 'viewer' | 'write' | 'read' | string;

/** Backend collaborator shape accepted from REST or GraphQL responses. */
export interface BackendCollaborator {
  /** Unique collaborator entry identifier. */
  id?: string;
  /** Collaborator user identifier. */
  userId?: string;
  /** Display name. */
  name?: string;
  /** Email address. */
  email?: string;
  /** Initials used by avatar displays. */
  initials?: string;
  /** Avatar color token. */
  avatarColor?: string;
  /** Alternate avatar color field used by current document collaborator DTOs. */
  color?: string;
  /** Backend role or permission value. */
  role?: BackendWorkspaceRole | null;
  /** Alternate permission field for assumed workspace APIs. */
  permission?: BackendWorkspaceRole | null;
  /** ISO creation timestamp. */
  createdAt?: string;
  /** ISO update timestamp. */
  updatedAt?: string;
}

/** Backend owner shape accepted from REST or GraphQL responses. */
export interface BackendWorkspaceOwner {
  /** Owner user identifier. */
  id?: string;
  /** Owner display name. */
  name?: string;
  /** Owner email address. */
  email?: string;
  /** Owner initials. */
  initials?: string;
  /** Owner avatar color token. */
  avatarColor?: string;
}

/** Backend workspace item shape accepted from REST or GraphQL responses. */
export interface BackendWorkspaceItem {
  /** Unique item identifier. */
  id: string;
  /** Item kind for the assumed workspace API. */
  kind?: 'document' | 'folder' | string;
  /** Alternate item type field. */
  type?: 'document' | 'folder' | string;
  /** Workspace item display name. */
  name?: string;
  /** Current document backend title field. */
  title?: string;
  /** Parent folder identifier. */
  parentId?: string | null;
  /** Owner summary when returned as an object. */
  owner?: BackendWorkspaceOwner;
  /** Owner identifier. */
  ownerId?: string;
  /** Owner display name. */
  ownerName?: string;
  /** Owner email address. */
  ownerEmail?: string;
  /** Current user's backend role. */
  currentUserRole?: BackendWorkspaceRole | null;
  /** Alternate current user's backend permission. */
  permission?: BackendWorkspaceRole | null;
  /** Backend sharing state. */
  sharingStatus?: SharingStatus | string;
  /** Current document visibility field. */
  visibility?: 'private' | 'shared' | 'workspace' | string;
  /** Whether current user may edit/write. */
  canEdit?: boolean;
  /** Whether current user may write. */
  canWrite?: boolean;
  /** Whether current user may manage sharing. */
  canShare?: boolean;
  /** Whether current user may manage the item. */
  canManage?: boolean;
  /** Whether current user may delete. */
  canDelete?: boolean;
  /** Collaborators returned by the backend. */
  collaborators?: BackendCollaborator[];
  /** ISO creation timestamp. */
  createdAt: string;
  /** ISO update timestamp. */
  updatedAt: string;
  /** Document revision for future editor integration. */
  revision?: number;
  /** Last opened timestamp for documents. */
  lastOpenedAt?: string;
  /** Number of direct folder children. */
  childCount?: number;
}

/** Backend breadcrumb shape accepted from REST or GraphQL responses. */
export interface BackendWorkspaceBreadcrumb {
  /** Folder identifier, or null for root. */
  id?: string | null;
  /** Breadcrumb segment name. */
  name?: string;
}

/** Backend list response shape accepted from REST or GraphQL responses. */
export interface BackendWorkspaceItemsResponse {
  /** Current folder identifier, or null for root. */
  folderId?: string | null;
  /** Alternate current folder identifier field. */
  parentId?: string | null;
  /** Breadcrumb path for the current folder. */
  breadcrumbs?: BackendWorkspaceBreadcrumb[];
  /** Child items in the current folder. */
  items: BackendWorkspaceItem[];
}

/** Backend move target shape accepted from REST or GraphQL responses. */
export interface BackendMoveTarget {
  /** Folder identifier, or null for root. */
  id?: string | null;
  /** Target folder name. */
  name?: string;
  /** Display path for the target folder. */
  path?: string;
  /** Whether the target accepts the current move. */
  canMoveHere?: boolean;
}

const fallbackTimestamp = '1970-01-01T00:00:00.000Z';

/**
 * Converts backend role strings into normalized frontend permissions.
 *
 * @param role - Backend role or permission value.
 * @returns Frontend permission level.
 */
export function toPermissionLevel(role: BackendWorkspaceRole | null | undefined): PermissionLevel {
  if (role === 'owner') {
    return 'owner';
  }

  if (role === 'editor' || role === 'write') {
    return 'write';
  }

  return 'read';
}

/**
 * Converts a normalized permission into the canonical backend permission value.
 *
 * @param permission - Frontend permission selected by the user.
 * @returns Backend role value.
 */
export function toBackendPermission(
  permission: Exclude<PermissionLevel, 'owner'>,
): 'write' | 'read' {
  return permission === 'write' ? 'write' : 'read';
}

/**
 * Maps a backend folder listing response into normalized frontend state.
 *
 * @param response - REST or GraphQL workspace listing response.
 * @returns Normalized workspace listing result.
 */
export function toWorkspaceItemsResult(
  response: BackendWorkspaceItemsResponse,
): WorkspaceItemsResult {
  return {
    breadcrumbs: toWorkspaceBreadcrumbs(response.breadcrumbs),
    folderId: response.folderId ?? response.parentId ?? null,
    items: response.items.map(toWorkspaceItem),
  };
}

/**
 * Maps a backend workspace item into a discriminated frontend item.
 *
 * @param item - REST or GraphQL workspace item.
 * @returns Normalized workspace item.
 */
export function toWorkspaceItem(item: BackendWorkspaceItem): WorkspaceItem {
  const kind = item.kind === 'folder' || item.type === 'folder' ? 'folder' : 'document';
  const permission = toPermissionLevel(item.permission ?? item.currentUserRole);
  const canWrite =
    item.canWrite ?? item.canEdit ?? (permission === 'owner' || permission === 'write');
  const canManage = item.canManage ?? item.canShare ?? permission === 'owner';
  const common = {
    canDelete: item.canDelete ?? permission === 'owner',
    canManage,
    canWrite,
    collaborators: toCollaborators(item.collaborators ?? []),
    createdAt: item.createdAt ?? fallbackTimestamp,
    id: item.id,
    name: item.name ?? item.title ?? 'Untitled',
    owner: toWorkspaceOwner(item),
    parentId: item.parentId ?? null,
    permission,
    sharingStatus: toSharingStatus(item, permission),
    updatedAt: item.updatedAt ?? item.createdAt ?? fallbackTimestamp,
  };

  if (kind === 'folder') {
    return {
      ...common,
      childCount: item.childCount,
      kind: 'folder',
    };
  }

  return {
    ...common,
    kind: 'document',
    lastOpenedAt: item.lastOpenedAt,
    revision: item.revision,
  };
}

/**
 * Maps backend move targets into normalized folder destinations.
 *
 * @param targets - REST or GraphQL move target response array.
 * @returns Normalized move targets.
 */
export function toMoveTargets(targets: BackendMoveTarget[]): MoveTarget[] {
  return targets.map((target) => ({
    canMoveHere: target.canMoveHere ?? true,
    id: target.id ?? null,
    name: target.name ?? 'Workspace',
    path: target.path ?? target.name ?? 'Workspace',
  }));
}

/**
 * Maps backend collaborator objects into normalized frontend collaborator rows.
 *
 * @param collaborators - Backend collaborators returned by REST or GraphQL.
 * @returns Normalized collaborator entries.
 */
export function toCollaborators(collaborators: BackendCollaborator[]): Collaborator[] {
  return collaborators.map(toCollaborator);
}

/**
 * Maps backend breadcrumbs and guarantees a root segment.
 *
 * @param breadcrumbs - Optional backend breadcrumb path.
 * @returns Normalized breadcrumb path.
 */
function toWorkspaceBreadcrumbs(
  breadcrumbs: BackendWorkspaceBreadcrumb[] | undefined,
): WorkspaceBreadcrumb[] {
  const segments = breadcrumbs?.map((breadcrumb) => ({
    id: breadcrumb.id ?? null,
    name: breadcrumb.name ?? 'Workspace',
  })) ?? [{ id: null, name: 'Workspace' }];

  return segments.length > 0 ? segments : [{ id: null, name: 'Workspace' }];
}

/**
 * Maps backend collaborator objects into normalized frontend collaborators.
 *
 * @param collaborator - Backend collaborator entry.
 * @returns Normalized collaborator entry.
 */
function toCollaborator(collaborator: BackendCollaborator): Collaborator {
  const userId = collaborator.userId ?? collaborator.id ?? 'unknown-user';

  return {
    avatarColor: collaborator.avatarColor ?? collaborator.color,
    createdAt: collaborator.createdAt ?? fallbackTimestamp,
    email: collaborator.email,
    id: collaborator.id ?? userId,
    initials: collaborator.initials,
    name: collaborator.name ?? collaborator.email ?? 'Unknown user',
    permission: toPermissionLevel(collaborator.permission ?? collaborator.role),
    updatedAt: collaborator.updatedAt ?? collaborator.createdAt ?? fallbackTimestamp,
    userId,
  };
}

/**
 * Maps owner fields from either object-shaped or flattened backend responses.
 *
 * @param item - Backend workspace item.
 * @returns Normalized owner summary.
 */
function toWorkspaceOwner(item: BackendWorkspaceItem): WorkspaceUserSummary {
  return {
    email: item.owner?.email ?? item.ownerEmail,
    id: item.owner?.id ?? item.ownerId ?? 'unknown-owner',
    initials: item.owner?.initials,
    name: item.owner?.name ?? item.ownerName ?? 'Unknown owner',
    avatarColor: item.owner?.avatarColor,
  };
}

/**
 * Derives the sharing badge state when the backend does not return one directly.
 *
 * @param item - Backend workspace item.
 * @param permission - Current user's normalized permission.
 * @returns Sharing status for display.
 */
function toSharingStatus(item: BackendWorkspaceItem, permission: PermissionLevel): SharingStatus {
  if (
    item.sharingStatus === 'private' ||
    item.sharingStatus === 'shared-by-me' ||
    item.sharingStatus === 'shared-with-me'
  ) {
    return item.sharingStatus;
  }

  if (item.visibility === 'private') {
    return 'private';
  }

  if (permission === 'owner') {
    return 'shared-by-me';
  }

  return 'shared-with-me';
}
