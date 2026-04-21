import { useState } from "react";

type UseDashboardModalStateInput = {
  selectedCount: number;
  singleSelectedDocumentId: string | null;
};

type UseDashboardModalStateResult = {
  isCreateModalOpen: boolean;
  isRenameModalOpen: boolean;
  isDeleteModalOpen: boolean;
  selectedDocumentId: string | null;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  openRenameModal: (id: string) => void;
  closeRenameModal: () => void;
  openDeleteModal: (id?: string) => void;
  closeDeleteModal: () => void;
  resetModalSelection: () => void;
};

/**
 * Owns modal open/close flags and selected-document coordination for dashboard dialogs.
 */
export function useDashboardModalState({
  selectedCount,
  singleSelectedDocumentId,
}: UseDashboardModalStateInput): UseDashboardModalStateResult {
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isRenameModalOpen, setRenameModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null,
  );

  function openCreateModal(): void {
    setCreateModalOpen(true);
  }

  function closeCreateModal(): void {
    setCreateModalOpen(false);
  }

  function openRenameModal(id: string): void {
    setSelectedDocumentId(id);
    setRenameModalOpen(true);
  }

  function closeRenameModal(): void {
    setRenameModalOpen(false);
  }

  function openDeleteModal(id?: string): void {
    if (id) {
      setSelectedDocumentId(id);
    } else if (selectedCount === 1 && singleSelectedDocumentId) {
      setSelectedDocumentId(singleSelectedDocumentId);
    } else {
      setSelectedDocumentId(null);
    }

    setDeleteModalOpen(true);
  }

  function closeDeleteModal(): void {
    setDeleteModalOpen(false);
  }

  function resetModalSelection(): void {
    setSelectedDocumentId(null);
  }

  return {
    isCreateModalOpen,
    isRenameModalOpen,
    isDeleteModalOpen,
    selectedDocumentId,
    openCreateModal,
    closeCreateModal,
    openRenameModal,
    closeRenameModal,
    openDeleteModal,
    closeDeleteModal,
    resetModalSelection,
  };
}
