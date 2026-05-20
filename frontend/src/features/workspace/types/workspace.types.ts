import type { EntityId, Timestamped } from '../../../shared/types';

export type { EntityId };

/** Item categories rendered by the workspace explorer. */
export type WorkspaceItemKind = 'document' | 'folder';

/** Frontend permission levels normalized across REST and GraphQL role names. */
export type PermissionLevel = 'owner' | 'write' | 'read';

/** Sharing state shown in the workspace explorer. */
export type SharingStatus = 'private' | 'shared-by-me' | 'shared-with-me';

/** High-level filters available from the workspace sidebar. */
export type WorkspaceFilter = 'all' | 'private' | 'shared-by-me' | 'shared-with-me';

/** User summary attached to workspace items and sharing entries. */
export interface WorkspaceUserSummary {
  /** Unique user identifier. */
  id: EntityId;
  /** Display name shown in metadata cells. */
  name: string;
  /** User email address when returned by the backend. */
  email?: string;
  /** Initials used by avatar-style collaborator displays. */
  initials?: string;
  /** Tailwind color token returned by the backend for avatars. */
  avatarColor?: string;
}

/** Collaborator access entry normalized for the sharing modal. */
export interface Collaborator extends Timestamped {
  /** Unique collaborator entry identifier. */
  id: EntityId;
  /** User identifier for the collaborator. */
  userId: EntityId;
  /** User display name. */
  name: string;
  /** Collaborator email address when available. */
  email?: string;
  /** Collaborator initials when available. */
  initials?: string;
  /** Collaborator avatar color token when available. */
  avatarColor?: string;
  /** Permission granted to the collaborator. */
  permission: PermissionLevel;
}

/** Shared metadata for folders and documents in the workspace explorer. */
export interface WorkspaceItemBase extends Timestamped {
  /** Unique item identifier. */
  id: EntityId;
  /** Discriminant used for document/folder rendering and actions. */
  kind: WorkspaceItemKind;
  /** Display name shown in the explorer. */
  name: string;
  /** Parent folder identifier, or null for root-level items. */
  parentId: EntityId | null;
  /** Owner summary shown in metadata cells. */
  owner: WorkspaceUserSummary;
  /** Sharing state shown as a badge. */
  sharingStatus: SharingStatus;
  /** Current user's normalized permission. */
  permission: PermissionLevel;
  /** Collaborators returned by the backend. */
  collaborators: Collaborator[];
  /** Whether the current user can edit item metadata or contents. */
  canWrite: boolean;
  /** Whether the current user can manage sharing for the item. */
  canManage: boolean;
  /** Whether the current user can delete the item. */
  canDelete: boolean;
}

/** Document item rendered by the workspace explorer. */
export interface DocumentItem extends WorkspaceItemBase {
  /** Discriminant for document items. */
  kind: 'document';
  /** Revision returned by a document backend, used by future editor integration. */
  revision?: number;
  /** ISO timestamp for the last opened time when available. */
  lastOpenedAt?: string;
}

/** Folder item rendered by the workspace explorer. */
export interface FolderItem extends WorkspaceItemBase {
  /** Discriminant for folder items. */
  kind: 'folder';
  /** Number of direct children when returned by the backend. */
  childCount?: number;
}

/** Any item that can be rendered in the workspace explorer. */
export type WorkspaceItem = DocumentItem | FolderItem;

/** Breadcrumb segment for the current workspace folder path. */
export interface WorkspaceBreadcrumb {
  /** Folder identifier, or null for the root workspace. */
  id: EntityId | null;
  /** Segment label shown in the breadcrumb navigation. */
  name: string;
}

/** Folder option available in the move dialog. */
export interface MoveTarget {
  /** Target folder identifier, or null for the root workspace. */
  id: EntityId | null;
  /** Display label for the target folder. */
  name: string;
  /** Breadcrumb-like path shown to disambiguate folders. */
  path: string;
  /** Whether the current user may move an item into this folder. */
  canMoveHere: boolean;
}

/** Payload for sharing an item with another user. */
export interface ShareInvite {
  /** Item to share. */
  itemId: EntityId;
  /** Recipient email address. */
  email: string;
  /** Permission to grant. */
  permission: Exclude<PermissionLevel, 'owner'>;
}

/** Result returned when listing a folder's children. */
export interface WorkspaceItemsResult {
  /** Current folder identifier, or null for the root workspace. */
  folderId: EntityId | null;
  /** Breadcrumb path for the current folder. */
  breadcrumbs: WorkspaceBreadcrumb[];
  /** Items inside the current folder. */
  items: WorkspaceItem[];
}

/** Input used when creating a folder. */
export interface CreateFolderInput {
  /** New folder name. */
  name: string;
  /** Parent folder identifier, or null for root. */
  parentId: EntityId | null;
}

/** Input used when creating a document shell from the workspace. */
export interface CreateDocumentInput {
  /** New document name. */
  name: string;
  /** Parent folder identifier, or null for root. */
  parentId: EntityId | null;
}

/** Input used when renaming a document or folder. */
export interface RenameItemInput {
  /** Item being renamed. */
  itemId: EntityId;
  /** Replacement item name. */
  name: string;
}

/** Input used when deleting a document or folder. */
export interface DeleteItemInput {
  /** Item being deleted. */
  itemId: EntityId;
}

/** Input used when moving a document or folder. */
export interface MoveItemInput {
  /** Item being moved. */
  itemId: EntityId;
  /** Destination folder identifier, or null for root. */
  targetFolderId: EntityId | null;
}

/** Input used when changing an existing collaborator permission. */
export interface UpdateCollaboratorInput {
  /** Item whose collaborator should change. */
  itemId: EntityId;
  /** Collaborator entry to update. */
  collaboratorId: EntityId;
  /** Replacement permission. */
  permission: Exclude<PermissionLevel, 'owner'>;
}

/** Input used when removing a collaborator from an item. */
export interface RemoveCollaboratorInput {
  /** Item whose collaborator should be removed. */
  itemId: EntityId;
  /** Collaborator entry to remove. */
  collaboratorId: EntityId;
}

/** Contract implemented by REST and GraphQL workspace clients. */
export interface WorkspaceClient {
  /**
   * Lists child items for a folder.
   *
   * @param parentId - Folder identifier, or null for root.
   * @returns Normalized folder contents.
   */
  listItems(parentId: EntityId | null): Promise<WorkspaceItemsResult>;
  /**
   * Lists direct collaborators for an accessible item.
   *
   * @param itemId - Item whose direct collaborators should load.
   * @returns Normalized collaborator entries.
   */
  listCollaborators(itemId: EntityId): Promise<Collaborator[]>;
  /**
   * Creates a folder in the current workspace hierarchy.
   *
   * @param input - Folder creation input.
   * @returns Created folder item.
   */
  createFolder(input: CreateFolderInput): Promise<FolderItem>;
  /**
   * Creates a document shell in the current workspace hierarchy.
   *
   * @param input - Document creation input.
   * @returns Created document item.
   */
  createDocument(input: CreateDocumentInput): Promise<DocumentItem>;
  /**
   * Renames a document or folder.
   *
   * @param input - Rename input.
   * @returns Updated workspace item.
   */
  renameItem(input: RenameItemInput): Promise<WorkspaceItem>;
  /**
   * Deletes a document or folder.
   *
   * @param input - Delete input.
   */
  deleteItem(input: DeleteItemInput): Promise<void>;
  /**
   * Lists valid folder destinations for a move operation.
   *
   * @param itemId - Item being moved.
   * @returns Move targets available to the user.
   */
  listMoveTargets(itemId: EntityId): Promise<MoveTarget[]>;
  /**
   * Moves a document or folder.
   *
   * @param input - Move input.
   * @returns Updated workspace item.
   */
  moveItem(input: MoveItemInput): Promise<WorkspaceItem>;
  /**
   * Shares a document or folder with another user.
   *
   * @param input - Share invitation input.
   * @returns Updated workspace item with collaborator state.
   */
  shareItem(input: ShareInvite): Promise<WorkspaceItem>;
  /**
   * Updates a collaborator permission.
   *
   * @param input - Collaborator update input.
   * @returns Updated workspace item with collaborator state.
   */
  updateCollaborator(input: UpdateCollaboratorInput): Promise<WorkspaceItem>;
  /**
   * Removes a collaborator from an item.
   *
   * @param input - Collaborator removal input.
   * @returns Updated workspace item with collaborator state.
   */
  removeCollaborator(input: RemoveCollaboratorInput): Promise<WorkspaceItem>;
}
