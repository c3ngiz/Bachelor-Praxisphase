import { useEffect, useMemo } from "react";

import { useAuth } from "@/features/auth";
import { Notice } from "@/shared/components/ui";

import { DashboardLayout } from "../components/layout";
import { DashboardDocumentsSection } from "../components/sections";

import {
  CreateDocumentModal,
  DeleteConfirmationModal,
  RenameDocumentModal,
} from "../components/modals";
import { MultiSelectToolbar } from "../components/toolbar";

import {
  selectProcessedDocuments,
  useDocumentsStore,
} from "@/features/documents";
import { useDashboardSelectionState } from "../hooks/useDashboardSelectionState";
import { useDashboardDocumentActions } from "../hooks/useDashboardDocumentActions";
import { useDashboardModalState } from "../hooks/useDashboardModalState";
import { useDashboardViewControls } from "../hooks/useDashboardViewControls";
import { getDashboardCollection } from "../utils/dashboardCollections";

/**
 * Dashboard page coordinator for documents, sections, filters and modal flows.
 */
export default function DashboardPage() {
  const { token, user, isLoading: isAuthLoading } = useAuth();

  const {
    documents,
    isLoading,
    error,
    loadDocuments,
    clearError,
  } = useDocumentsStore();

  const { selectedDocuments, selectedCount, clearSelection } =
    useDashboardSelectionState();

  const { activeCollection, searchQuery, sortBy, filters, viewMode } =
    useDashboardViewControls();
  const currentUserId = user?.id ?? null;

  useEffect(() => {
    if (!token) return;
    void loadDocuments(token);
  }, [token, loadDocuments]);

  const selectedDocumentIds = useMemo(() => {
    return Array.from(selectedDocuments);
  }, [selectedDocuments]);

  const singleSelectedDocumentId =
    selectedCount === 1 ? selectedDocumentIds[0] : null;

  const {
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
  } = useDashboardModalState({
    selectedCount,
    singleSelectedDocumentId,
  });

  const {
    selectedDocument,
    createDocumentFromModal,
    openDocument,
    renameDocumentFromModal,
    confirmDeleteFromModal,
  } = useDashboardDocumentActions({
    token,
    documents,
    selectedDocumentId,
    selectedDocumentIds,
    selectedCount,
    clearSelection,
    onBeforeCreate: clearError,
  });

  const isBulkDelete = selectedCount > 1;

  const activeCollectionDetails = useMemo(() => {
    return getDashboardCollection(documents, currentUserId, activeCollection);
  }, [activeCollection, currentUserId, documents]);

  const processedDocuments = useMemo(() => {
    return selectProcessedDocuments(
      activeCollectionDetails.documents,
      searchQuery,
      filters,
      sortBy,
    );
  }, [activeCollectionDetails.documents, searchQuery, filters, sortBy]);

  function handleOpenCreateModal() {
    clearError();
    openCreateModal();
  }

  function handleOpenRenameModal(id: string) {
    clearError();
    openRenameModal(id);
  }

  function handleOpenDeleteModal(id?: string) {
    clearError();
    openDeleteModal(id);
  }

  const loading = isLoading || isAuthLoading;

  return (
    <>
      <DashboardLayout documents={documents} currentUserId={currentUserId}>
        <div className="w-full px-4 py-5 sm:px-6 lg:px-8">
          {error ? (
            <Notice variant="danger" className="mb-4">
              <Notice.Description>{error}</Notice.Description>
            </Notice>
          ) : null}

          <DashboardDocumentsSection
            collectionId={activeCollectionDetails.id}
            collectionLabel={activeCollectionDetails.label}
            collectionDescription={activeCollectionDetails.description}
            collectionTotal={activeCollectionDetails.documents.length}
            documents={processedDocuments}
            viewMode={viewMode}
            loading={loading}
            onOpenDocument={(id) => void openDocument(id)}
            onRenameDocument={handleOpenRenameModal}
            onDeleteDocument={(id) => handleOpenDeleteModal(id)}
            onCreateDocument={handleOpenCreateModal}
          />
        </div>
      </DashboardLayout>

      {selectedCount > 0 ? (
        <MultiSelectToolbar
          count={selectedCount}
          onClear={clearSelection}
          onDelete={() => handleOpenDeleteModal()}
        />
      ) : null}

      <CreateDocumentModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onCreate={createDocumentFromModal}
      />

      <RenameDocumentModal
        isOpen={isRenameModalOpen}
        onClose={closeRenameModal}
        currentName={selectedDocument?.title ?? ""}
        onRename={renameDocumentFromModal}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          closeDeleteModal();
          resetModalSelection();
        }}
        onConfirm={async () => {
          await confirmDeleteFromModal();
          resetModalSelection();
        }}
        documentTitle={selectedDocument?.title}
        bulkCount={isBulkDelete ? selectedCount : 0}
      />
    </>
  );
}
