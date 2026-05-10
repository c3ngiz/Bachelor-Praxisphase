import type { PermissionLevel, WorkspaceItem, WorkspaceItemCollaborator } from "@prisma/client";

/** Authenticated user fields required by workspace services. */
export interface WorkspaceAuthUser {
  id: string;
  email: string;
  name: string;
  initials: string;
  avatarColor: string;
}

/** Effective permission returned after direct and inherited access checks. */
export type EffectivePermission = "owner" | PermissionLevel | null;

/** User summary embedded in workspace responses. */
export interface WorkspaceUserSummary {
  id: string;
  email: string;
  name: string;
  initials: string;
  avatarColor: string;
}

/** Workspace item record with relations needed for permission and response mapping. */
export type WorkspaceItemWithRelations = WorkspaceItem & {
  owner: WorkspaceUserSummary;
  document: {
    id: string;
    content: unknown;
    revision: number;
    createdAt: Date;
    updatedAt: Date;
    lastOpenedAt: Date | null;
    lastEditedById: string;
    lastEditedByName: string;
    lastEditedAt: Date;
  } | null;
  collaborators: Array<
    WorkspaceItemCollaborator & {
      user: WorkspaceUserSummary;
    }
  >;
};

/** Normalized collaborator response shared by REST and GraphQL. */
export interface WorkspaceCollaboratorResponse {
  id: string;
  userId: string;
  email: string;
  name: string;
  initials: string;
  avatarColor: string;
  permission: "owner" | PermissionLevel;
  role: "owner" | PermissionLevel;
  createdAt: string;
  updatedAt: string;
}

/** Normalized workspace item response shared by REST and GraphQL. */
export interface WorkspaceItemResponse {
  id: string;
  kind: "folder" | "document";
  type: "folder" | "document";
  name: string;
  title: string;
  parentId: string | null;
  owner: WorkspaceUserSummary;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  currentUserRole: "owner" | PermissionLevel;
  permission: "owner" | PermissionLevel;
  sharingStatus: "private" | "shared-by-me" | "shared-with-me";
  visibility: "private" | "shared";
  canEdit: boolean;
  canWrite: boolean;
  canShare: boolean;
  canManage: boolean;
  canDelete: boolean;
  collaborators: WorkspaceCollaboratorResponse[];
  createdAt: string;
  updatedAt: string;
  revision?: number;
  lastOpenedAt?: string | null;
  childCount?: number;
}

/** Breadcrumb segment returned with folder listings. */
export interface WorkspaceBreadcrumbResponse {
  id: string | null;
  name: string;
}

/** Folder listing response consumed by the frontend workspace service. */
export interface WorkspaceItemsResponse {
  folderId: string | null;
  breadcrumbs: WorkspaceBreadcrumbResponse[];
  items: WorkspaceItemResponse[];
}

/** Folder destination returned for move dialogs. */
export interface MoveTargetResponse {
  id: string | null;
  name: string;
  path: string;
  canMoveHere: boolean;
}

/** Legacy document response kept for the existing editor/document APIs. */
export interface WorkspaceLegacyDocumentResponse {
  id: string;
  title: string;
  content: unknown;
  revision: number;
  author: string;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt?: string;
  visibility: "private" | "shared" | "workspace";
  workspaceId: string;
  ownerId: string;
  ownerName: string;
  collaborators: Array<{
    id: string;
    name: string;
    initials: string;
    color: string;
    role: "owner" | "editor" | "viewer";
  }>;
  currentUserRole: "owner" | "editor" | "viewer" | null;
  canEdit: boolean;
  canShare: boolean;
  canDelete: boolean;
  lastEditedById: string;
  lastEditedByName: string;
  lastEditedAt: string;
}
