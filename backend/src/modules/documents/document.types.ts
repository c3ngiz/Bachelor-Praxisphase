export type DocumentRole = "owner" | "editor" | "viewer";
export type DocumentVisibility =
  | "private"
  | "shared"
  | "workspace";

export type DocumentCollaborator = {
  id: string;
  name: string;
  initials: string;
  color: string;
  role: DocumentRole;
};

export type DocumentDto = {
  id: string;
  title: string;
  content: unknown;
  revision: number;
  author: string;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt?: string;
  visibility: DocumentVisibility;
  workspaceId: string;
  ownerId: string;
  ownerName: string;
  collaborators: DocumentCollaborator[];
  lastEditedById: string;
  lastEditedByName: string;
  lastEditedAt: string;
};

export type DocumentUpdateEvent = {
  type: 'document.updated';
  documentId: string;
  version: number;
  userId: string;
  timestamp: string;
  operation: {
    kind: string;
    [key: string]: unknown;
  };
  document: DocumentDto;
};
