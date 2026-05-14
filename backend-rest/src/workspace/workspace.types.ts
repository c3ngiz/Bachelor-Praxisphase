import type { UserRecord } from '../users/user.mapper.js';

/**
 * Effective permission levels exposed to the frontend.
 */
export type WorkspacePermissionLevel = 'owner' | 'write' | 'read';

/**
 * Prisma workspace item type values.
 */
export type WorkspaceItemTypeValue = 'FOLDER' | 'DOCUMENT';

/**
 * Prisma workspace share permission values.
 */
export type WorkspaceSharePermissionValue = 'READ' | 'WRITE';

/**
 * Direct workspace share record loaded with collaborator user data.
 */
export interface WorkspaceShareRecord {
  /** Unique share identifier. */
  id: string;
  /** Shared item identifier. */
  itemId: string;
  /** Collaborator user identifier. */
  userId: string;
  /** Granted permission. */
  permission: WorkspaceSharePermissionValue;
  /** Creation timestamp. */
  createdAt: Date;
  /** Update timestamp. */
  updatedAt: Date;
  /** Collaborator user summary. */
  user: UserRecord;
}

/**
 * Document content metadata joined onto document workspace items.
 */
export interface WorkspaceDocumentContentRecord {
  /** Current document revision. */
  revision: number;
  /** Last time the document content endpoint was opened. */
  lastOpenedAt: Date | null;
}

/**
 * Workspace item record loaded for API responses.
 */
export interface WorkspaceRecord {
  /** Unique item identifier. */
  id: string;
  /** Display name. */
  name: string;
  /** Folder or document type. */
  type: WorkspaceItemTypeValue;
  /** Owner user identifier. */
  ownerId: string;
  /** Parent folder identifier or null. */
  parentId: string | null;
  /** Creation timestamp. */
  createdAt: Date;
  /** Update timestamp. */
  updatedAt: Date;
  /** Soft-delete timestamp or null. */
  deletedAt: Date | null;
  /** Owner user summary. */
  owner: UserRecord;
  /** Direct collaborator shares on this item. */
  shares: WorkspaceShareRecord[];
  /** Document content metadata for documents. */
  documentContent?: WorkspaceDocumentContentRecord | null;
  /** Relation counts used for folder child counts. */
  _count?: {
    /** Number of direct children. */
    children: number;
  };
}

/**
 * Access calculation result for a user and workspace item.
 */
export interface WorkspaceAccess {
  /** Effective permission after owner, direct share, and inherited share checks. */
  permission: WorkspacePermissionLevel;
  /** Whether permission came from a direct share on this item. */
  direct: boolean;
}

/**
 * Serialized collaborator response consumed by the frontend mapper.
 */
export interface CollaboratorResponse {
  /** Frontend passes this value back in collaborator route params. */
  id: string;
  /** Collaborator user identifier. */
  userId: string;
  /** Collaborator display name. */
  name: string;
  /** Collaborator email address. */
  email: string;
  /** Collaborator initials. */
  initials: string;
  /** Collaborator avatar color token. */
  avatarColor: string;
  /** Granted permission in frontend terms. */
  permission: Exclude<WorkspacePermissionLevel, 'owner'>;
  /** ISO creation timestamp. */
  createdAt: string;
  /** ISO update timestamp. */
  updatedAt: string;
}

/**
 * Serialized workspace owner summary.
 */
export interface WorkspaceOwnerResponse {
  /** Owner user identifier. */
  id: string;
  /** Owner display name. */
  name: string;
  /** Owner email address. */
  email: string;
  /** Owner initials. */
  initials: string;
  /** Owner avatar color token. */
  avatarColor: string;
}

/**
 * Serialized workspace item response accepted by the frontend mapper.
 */
export interface WorkspaceItemResponse {
  /** Unique item identifier. */
  id: string;
  /** Discriminant used by frontend tables. */
  kind: 'folder' | 'document';
  /** Alternate type field accepted by the mapper. */
  type: 'folder' | 'document';
  /** Display name. */
  name: string;
  /** Parent folder identifier or null. */
  parentId: string | null;
  /** Owner identifier. */
  ownerId: string;
  /** Owner summary. */
  owner: WorkspaceOwnerResponse;
  /** Current user's effective permission. */
  permission: WorkspacePermissionLevel;
  /** Current user's effective role alias. */
  currentUserRole: WorkspacePermissionLevel;
  /** Sharing badge state. */
  sharingStatus: 'private' | 'shared-by-me' | 'shared-with-me';
  /** Whether the current user can edit metadata or document content. */
  canWrite: boolean;
  /** Whether the current user can edit metadata or document content. */
  canEdit: boolean;
  /** Whether the current user can manage sharing. */
  canManage: boolean;
  /** Whether the current user can manage sharing. */
  canShare: boolean;
  /** Whether the current user can delete the item. */
  canDelete: boolean;
  /** Direct collaborators on the item. */
  collaborators: CollaboratorResponse[];
  /** ISO creation timestamp. */
  createdAt: string;
  /** ISO update timestamp. */
  updatedAt: string;
  /** Direct child count for folders. */
  childCount?: number;
  /** Document revision for editor integrations. */
  revision?: number;
  /** Last opened timestamp for documents. */
  lastOpenedAt?: string;
}

/**
 * Breadcrumb segment for folder listings.
 */
export interface WorkspaceBreadcrumbResponse {
  /** Folder identifier, or null for root. */
  id: string | null;
  /** Segment label. */
  name: string;
}

/**
 * Folder listing response accepted directly or under a `workspace` property.
 */
export interface WorkspaceItemsResponse {
  /** Current folder identifier or null. */
  folderId: string | null;
  /** Alias accepted by the frontend mapper. */
  parentId: string | null;
  /** Breadcrumb trail for the current folder. */
  breadcrumbs: WorkspaceBreadcrumbResponse[];
  /** Visible items in the current folder. */
  items: WorkspaceItemResponse[];
}

/**
 * Move destination shown in the frontend move modal.
 */
export interface MoveTargetResponse {
  /** Folder identifier, or null for root. */
  id: string | null;
  /** Display name. */
  name: string;
  /** Breadcrumb-like path. */
  path: string;
  /** Whether the item can be moved here. */
  canMoveHere: boolean;
}
