import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import type { Document } from "@/features/documents";
import { useDocumentsStore } from "@/features/documents";

type UseDashboardDocumentActionsInput = {
  token: string | null;
  documents: Document[];
  selectedDocumentId: string | null;
  selectedDocumentIds: string[];
  selectedCount: number;
  clearSelection: () => void;
  onBeforeCreate?: () => void;
  workspaceId: string | null;
};

type UseDashboardDocumentActionsResult = {
  selectedDocument: Document | undefined;
  createDocumentFromModal: (name: string) => Promise<void>;
  openDocument: (id: string) => Promise<void>;
  renameDocumentFromModal: (newName: string) => Promise<void>;
  confirmDeleteFromModal: () => Promise<void>;
};

/**
 * Encapsulates dashboard document workflows: open, create, rename and delete.
 */
export function useDashboardDocumentActions({
  token,
  documents,
  selectedDocumentId,
  selectedDocumentIds,
  selectedCount,
  clearSelection,
  onBeforeCreate,
  workspaceId,
}: UseDashboardDocumentActionsInput): UseDashboardDocumentActionsResult {
  const navigate = useNavigate();
  const {
    createDocument,
    updateDocument,
    deleteDocument,
    deleteDocuments,
    clearError,
  } = useDocumentsStore();

  const selectedDocument = useMemo(() => {
    return documents.find((doc) => doc.id === selectedDocumentId);
  }, [documents, selectedDocumentId]);

  async function createDocumentFromModal(name: string): Promise<void> {
    if (!token) {
      throw new Error("You must be signed in to create documents.");
    }

    onBeforeCreate?.();
    clearError();

    const newDoc = await createDocument(name, token, {
      workspaceId: workspaceId ?? undefined,
    });
    navigate(`/document/${newDoc.id}`);
  }

  async function openDocument(id: string): Promise<void> {
    const doc = documents.find((document) => document.id === id);
    if (!doc || !token) {
      return;
    }

    clearSelection();

    try {
      await updateDocument(
        doc.id,
        {
          expectedRevision: doc.revision,
          lastOpenedAt: new Date().toISOString(),
        },
        token,
      );
    } catch {
      // Non-blocking: allow navigation even if the last-opened timestamp fails.
    }

    navigate(`/document/${id}`);
  }

  async function renameDocumentFromModal(newName: string): Promise<void> {
    if (!selectedDocument || !token) {
      throw new Error("You must be signed in to rename documents.");
    }

    if (!selectedDocument.canEdit) {
      throw new Error("You do not have permission to rename this document.");
    }

    await updateDocument(
      selectedDocument.id,
      {
        expectedRevision: selectedDocument.revision,
        title: newName,
      },
      token,
    );
  }

  async function confirmDeleteFromModal(): Promise<void> {
    if (!token) {
      throw new Error("You must be signed in to delete documents.");
    }

    if (selectedCount > 1) {
      const deletableIds = documents
        .filter((document) => selectedDocumentIds.includes(document.id) && document.canDelete)
        .map((document) => document.id);

      if (deletableIds.length !== selectedDocumentIds.length) {
        throw new Error("Only document owners can delete selected documents.");
      }

      await deleteDocuments(deletableIds, token);
      clearSelection();
      return;
    }

    if (selectedDocumentId) {
      const document = documents.find((item) => item.id === selectedDocumentId);

      if (!document?.canDelete) {
        throw new Error("Only the owner can delete this document.");
      }

      await deleteDocument(selectedDocumentId, token);
      clearSelection();
    }
  }

  return {
    selectedDocument,
    createDocumentFromModal,
    openDocument,
    renameDocumentFromModal,
    confirmDeleteFromModal,
  };
}
