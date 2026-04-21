import { create } from "zustand";
import type { Document, DocumentCollaborator } from "../types/document.types";
import { loadDocuments, saveDocuments } from "../services/documentStorage";

interface DocumentsState {
  documents: Document[];

  createDocument: (title: string) => Document;
  updateDocument: (doc: Document) => void;
  deleteDocument: (id: string) => void;
  deleteDocuments: (ids: string[]) => void;
  getDocumentById: (id: string) => Document | undefined;

  setDocuments: (docs: Document[]) => void;
}

const currentUser: DocumentCollaborator = {
  id: "u-you",
  name: "You",
  initials: "U",
  color: "bg-emerald-500",
  role: "owner",
};

const teammatePool: DocumentCollaborator[] = [
  {
    id: "u-alex",
    name: "Alex Kim",
    initials: "AK",
    color: "bg-sky-500",
    role: "editor",
  },
  {
    id: "u-maya",
    name: "Maya Chen",
    initials: "MC",
    color: "bg-violet-500",
    role: "editor",
  },
  {
    id: "u-liam",
    name: "Liam Scott",
    initials: "LS",
    color: "bg-amber-500",
    role: "viewer",
  },
];

function normalizeDocument(document: Document): Document {
  return {
    ...document,
    collaborators: document.collaborators ?? [],
  };
}

function normalizeDocuments(documents: Document[]): Document[] {
  return documents.map(normalizeDocument);
}

function getDefaultCollaborators(title: string): {
  visibility: Document["visibility"];
  collaborators: DocumentCollaborator[];
  lastEditedBy: DocumentCollaborator;
} {
  const lower = title.toLowerCase();

  if (lower.includes("brief") || lower.includes("roadmap")) {
    return {
      visibility: "workspace",
      collaborators: [currentUser, teammatePool[0], teammatePool[1]],
      lastEditedBy: teammatePool[0],
    };
  }

  if (
    lower.includes("meeting") ||
    lower.includes("notes") ||
    lower.includes("plan")
  ) {
    return {
      visibility: "shared",
      collaborators: [currentUser, teammatePool[1]],
      lastEditedBy: teammatePool[1],
    };
  }

  return {
    visibility: "private",
    collaborators: [currentUser],
    lastEditedBy: currentUser,
  };
}

export const useDocumentsStore = create<DocumentsState>((set, get) => ({
  documents: normalizeDocuments(loadDocuments()),

  setDocuments: (docs) => {
    const normalized = normalizeDocuments(docs);

    set({ documents: normalized });
    saveDocuments(normalized);
  },

  createDocument: (title) => {
    const now = new Date().toISOString();
    const collaboration = getDefaultCollaborators(title);

    const newDoc: Document = {
      id: crypto.randomUUID(),
      title,
      author: currentUser.name,
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
      visibility: collaboration.visibility,
      ownerId: currentUser.id,
      ownerName: currentUser.name,
      collaborators: collaboration.collaborators,
      lastEditedById: collaboration.lastEditedBy.id,
      lastEditedByName: collaboration.lastEditedBy.name,
      lastEditedAt: now,
      content: {
        type: "doc",
        content: [],
      },
    };

    const updated = [newDoc, ...get().documents];

    set({ documents: updated });
    saveDocuments(updated);

    return newDoc;
  },

  updateDocument: (updatedDoc) => {
    const normalizedUpdatedDoc = normalizeDocument(updatedDoc);
    const updated = get().documents.map((doc) =>
      doc.id === normalizedUpdatedDoc.id ? normalizedUpdatedDoc : doc,
    );

    set({ documents: updated });
    saveDocuments(updated);
  },

  deleteDocument: (id) => {
    const updated = get().documents.filter((doc) => doc.id !== id);

    set({ documents: updated });
    saveDocuments(updated);
  },

  deleteDocuments: (ids) => {
    const updated = get().documents.filter((doc) => !ids.includes(doc.id));

    set({ documents: updated });
    saveDocuments(updated);
  },

  getDocumentById: (id) => {
    return get().documents.find((doc) => doc.id === id);
  },
}));
