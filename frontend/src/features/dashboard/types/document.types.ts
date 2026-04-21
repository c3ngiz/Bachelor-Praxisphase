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
  content: unknown; // Tiptap JSON

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

export interface DocumentPreview {
  text: string;
}
