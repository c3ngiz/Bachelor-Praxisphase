export type DocumentRole = "owner" | "editor" | "viewer";
export type DocumentVisibility = "private" | "shared" | "workspace";

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

  author: string;

  createdAt: string;
  updatedAt: string;
  lastOpenedAt?: string;

  visibility: DocumentVisibility;
  ownerId: string;
  ownerName: string;

  collaborators: DocumentCollaborator[];

  lastEditedById: string;
  lastEditedByName: string;
  lastEditedAt: string;
}

export type CreateDocumentInput = {
  title: string;
  content?: unknown;
  visibility?: DocumentVisibility;
  collaborators?: DocumentCollaborator[];
};

export type UpdateDocumentInput = Partial<
  Pick<
    Document,
    "title" | "content" | "visibility" | "collaborators" | "lastOpenedAt"
  >
>;

export interface DocumentPreview {
  text: string;
}

export function normalizeDocument(document: Document): Document {
  return {
    ...document,
    collaborators: document.collaborators ?? [],
  };
}

export function normalizeDocuments(documents: Document[]): Document[] {
  return documents.map(normalizeDocument);
}
