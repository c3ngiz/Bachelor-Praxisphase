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

type CollaborationProfile = {
  visibility: Document["visibility"];
  owner: DocumentCollaborator;
  collaborators: DocumentCollaborator[];
  lastEditedBy: DocumentCollaborator;
};

function buildLegacyCollaborationProfile(title: string): CollaborationProfile {
  const lower = title.toLowerCase();

  if (
    lower.includes("brief") ||
    lower.includes("roadmap") ||
    lower.includes("files") ||
    lower.includes("shared")
  ) {
    return {
      visibility: "workspace",
      owner: teammatePool[0],
      collaborators: [
        { ...currentUser, role: "editor" },
        teammatePool[0],
        teammatePool[1],
      ],
      lastEditedBy: teammatePool[0],
    };
  }

  if (
    lower.includes("meeting") ||
    lower.includes("notes") ||
    lower.includes("plan") ||
    lower.includes("hallo")
  ) {
    return {
      visibility: "shared",
      owner: teammatePool[1],
      collaborators: [{ ...currentUser, role: "viewer" }, teammatePool[1]],
      lastEditedBy: teammatePool[1],
    };
  }

  return {
    visibility: "private",
    owner: currentUser,
    collaborators: [currentUser],
    lastEditedBy: currentUser,
  };
}

function getDefaultCollaborators(title: string): CollaborationProfile {
  const lower = title.toLowerCase();

  if (lower.includes("brief") || lower.includes("roadmap")) {
    return {
      visibility: "workspace",
      owner: teammatePool[0],
      collaborators: [
        { ...currentUser, role: "editor" },
        teammatePool[0],
        teammatePool[1],
      ],
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
      owner: teammatePool[1],
      collaborators: [{ ...currentUser, role: "editor" }, teammatePool[1]],
      lastEditedBy: teammatePool[1],
    };
  }

  return {
    visibility: "private",
    owner: currentUser,
    collaborators: [currentUser],
    lastEditedBy: currentUser,
  };
}

function normalizeDocument(document: Document): Document {
  const profile = buildLegacyCollaborationProfile(document.title);
  const fallbackEditedAt =
    document.lastEditedAt ??
    document.updatedAt ??
    document.lastOpenedAt ??
    new Date().toISOString();

  return {
    ...document,
    visibility: document.visibility ?? profile.visibility,
    ownerId: document.ownerId ?? profile.owner.id,
    ownerName: document.ownerName ?? profile.owner.name,
    collaborators:
      document.collaborators && document.collaborators.length > 0
        ? document.collaborators
        : profile.collaborators,
    lastEditedById: document.lastEditedById ?? profile.lastEditedBy.id,
    lastEditedByName: document.lastEditedByName ?? profile.lastEditedBy.name,
    lastEditedAt: fallbackEditedAt,
  };
}

function normalizeDocuments(documents: Document[]): Document[] {
  return documents.map(normalizeDocument);
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
      ownerId: collaboration.owner.id,
      ownerName: collaboration.owner.name,
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
