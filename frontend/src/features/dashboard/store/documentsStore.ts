import { create } from "zustand";
import {
  createDocumentRequest,
  deleteDocumentRequest,
  getDocument,
  listDocuments,
  updateDocumentRequest,
} from "../services/documentsApi";
import type {
  CreateDocumentInput,
  Document,
  UpdateDocumentInput,
} from "../types/document.types";

interface DocumentsState {
  documents: Document[];
  isLoading: boolean;
  error: string | null;

  loadDocuments: (token: string) => Promise<void>;
  refreshDocument: (id: string, token: string) => Promise<Document | undefined>;
  createDocument: (
    title: string,
    token: string,
    input?: Omit<CreateDocumentInput, "title">,
  ) => Promise<Document>;
  updateDocument: (
    id: string,
    input: UpdateDocumentInput,
    token: string,
  ) => Promise<Document>;
  deleteDocument: (id: string, token: string) => Promise<void>;
  deleteDocuments: (ids: string[], token: string) => Promise<void>;
  getDocumentById: (id: string) => Document | undefined;

  setDocuments: (docs: Document[]) => void;
  clearDocuments: () => void;
  clearError: () => void;
}

function upsertDocument(documents: Document[], incoming: Document): Document[] {
  const existingIndex = documents.findIndex((doc) => doc.id === incoming.id);

  if (existingIndex === -1) {
    return [incoming, ...documents].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }

  const next = [...documents];
  next[existingIndex] = incoming;

  return next.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export const useDocumentsStore = create<DocumentsState>((set, get) => ({
  documents: [],
  isLoading: false,
  error: null,

  setDocuments: (docs) => set({ documents: docs }),

  clearDocuments: () => set({ documents: [] }),

  clearError: () => set({ error: null }),

  loadDocuments: async (token) => {
    set({ isLoading: true, error: null });

    try {
      const response = await listDocuments(token);
      set({ documents: response.documents, isLoading: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load documents.";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  refreshDocument: async (id, token) => {
    try {
      const response = await getDocument(id, token);
      set((state) => ({
        documents: upsertDocument(state.documents, response.document),
      }));
      return response.document;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to refresh document.";
      set({ error: message });
      throw error;
    }
  },

  createDocument: async (title, token, input) => {
    try {
      const response = await createDocumentRequest(
        {
          title,
          content: input?.content,
          visibility: input?.visibility,
          collaborators: input?.collaborators,
        },
        token,
      );

      set((state) => ({
        documents: upsertDocument(state.documents, response.document),
        error: null,
      }));

      return response.document;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create document.";
      set({ error: message });
      throw error;
    }
  },

  updateDocument: async (id, input, token) => {
    try {
      const response = await updateDocumentRequest(id, input, token);

      set((state) => ({
        documents: upsertDocument(state.documents, response.document),
        error: null,
      }));

      return response.document;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update document.";
      set({ error: message });
      throw error;
    }
  },

  deleteDocument: async (id, token) => {
    try {
      await deleteDocumentRequest(id, token);
      set((state) => ({
        documents: state.documents.filter((doc) => doc.id !== id),
        error: null,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete document.";
      set({ error: message });
      throw error;
    }
  },

  deleteDocuments: async (ids, token) => {
    try {
      await Promise.all(ids.map((id) => deleteDocumentRequest(id, token)));
      set((state) => ({
        documents: state.documents.filter((doc) => !ids.includes(doc.id)),
        error: null,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete documents.";
      set({ error: message });
      throw error;
    }
  },

  getDocumentById: (id) => {
    return get().documents.find((doc) => doc.id === id);
  },
}));
