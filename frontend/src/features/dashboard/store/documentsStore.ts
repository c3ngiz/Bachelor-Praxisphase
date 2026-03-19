import { create } from "zustand";
import type { Document } from "../types/document.types";
import { loadDocuments, saveDocuments } from "../services/documentStorage";

interface DocumentsState {
  documents: Document[];

  createDocument: (title: string) => Document;
  updateDocument: (doc: Document) => void;
  deleteDocument: (id: string) => void;
  getDocumentById: (id: string) => Document | undefined;

  setDocuments: (docs: Document[]) => void;
}

export const useDocumentsStore = create<DocumentsState>((set, get) => ({
  documents: loadDocuments(),

  setDocuments: (docs) => {
    set({ documents: docs });
    saveDocuments(docs);
  },

  createDocument: (title) => {
    const now = new Date().toISOString();

    const newDoc: Document = {
      id: crypto.randomUUID(),
      title,
      author: "You",
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
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
    const updated = get().documents.map((doc) =>
      doc.id === updatedDoc.id ? updatedDoc : doc,
    );

    set({ documents: updated });
    saveDocuments(updated);
  },

  deleteDocument: (id) => {
    const updated = get().documents.filter((doc) => doc.id !== id);

    set({ documents: updated });
    saveDocuments(updated);
  },

  getDocumentById: (id) => {
    return get().documents.find((doc) => doc.id === id);
  },
}));
