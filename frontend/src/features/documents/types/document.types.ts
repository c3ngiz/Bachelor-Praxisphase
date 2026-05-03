export type DocumentRole = "owner" | "editor" | "viewer";
export type DocumentVisibility =
  | "private"
  | "shared"
  | "workspace";

export interface DocumentCollaborator {
  id: string;
  name: string;
  initials: string;
  color: string;
  role: DocumentRole;
}

export interface Document {
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
  currentUserRole: DocumentRole | null;
  canEdit: boolean;
  canShare: boolean;
  canDelete: boolean;

  lastEditedById: string;
  lastEditedByName: string;
  lastEditedAt: string;
}

export type CreateDocumentInput = {
  title: string;
  content?: unknown;
  visibility?: DocumentVisibility;
  workspaceId?: string;
  collaborators?: DocumentCollaborator[];
};

export type UpdateDocumentInput = Partial<
  Pick<
    Document,
    "title" | "content" | "visibility" | "collaborators" | "lastOpenedAt"
  >
> & {
  expectedRevision: number;
};

export type InviteDocumentCollaboratorInput = {
  email: string;
  role: Exclude<DocumentRole, "owner">;
};

export interface DocumentPreview {
  text: string;
}

export function normalizeDocument(document: Document): Document {
  return {
    ...document,
    revision: document.revision ?? 1,
    collaborators: document.collaborators ?? [],
    currentUserRole: document.currentUserRole ?? null,
    canEdit: document.canEdit ?? false,
    canShare: document.canShare ?? false,
    canDelete: document.canDelete ?? false,
  };
}

export function normalizeDocuments(documents: Document[]): Document[] {
  return documents.map(normalizeDocument);
}
