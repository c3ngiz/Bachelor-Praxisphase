import { useEffect, useMemo } from "react";

import PageContainer from "@/shared/components/layout/PageContainer";
import { useAuth } from "@/features/auth";

import DashboardLayout from "../components/DashboardLayout";
import DashboardDocumentsSection from "../components/sections/DashboardDocumentsSection";
import DashboardHighlightsSections from "../components/sections/DashboardHighlightsSections";

import CreateDocumentModal from "../components/modals/CreateDocumentModal";
import RenameDocumentModal from "../components/modals/RenameDocumentModal";
import DeleteConfirmationModal from "../components/modals/DeleteConfirmationModal";
import MultiSelectToolbar from "../components/MultiSelectToolbar";

import {
  selectProcessedDocuments,
  useDocumentsStore,
} from "@/features/documents";
import { useDashboardSelectionState } from "../hooks/useDashboardSelectionState";
import { useDashboardDocumentActions } from "../hooks/useDashboardDocumentActions";
import { useDashboardModalState } from "../hooks/useDashboardModalState";
import { useDashboardSectionDocuments } from "../hooks/useDashboardSectionDocuments";
import { useDashboardViewControls } from "../hooks/useDashboardViewControls";

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

  const { searchQuery, sortBy, filters, viewMode } = useDashboardViewControls();
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
    sharedWithYouDocuments,
    teamActivityDocuments,
    recentDocuments,
  } = useDashboardSectionDocuments({
    documents,
    currentUserId,
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

  const processedDocuments = useMemo(() => {
    return selectProcessedDocuments(documents, searchQuery, filters, sortBy);
  }, [documents, searchQuery, filters, sortBy]);

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
      <DashboardLayout documents={documents}>
        <PageContainer title="">
          {error ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <DashboardHighlightsSections
            sharedWithYouDocuments={sharedWithYouDocuments}
            teamActivityDocuments={teamActivityDocuments}
            recentDocuments={recentDocuments}
            currentUserId={currentUserId}
            onOpenDocument={(id) => void openDocument(id)}
          />

          <DashboardDocumentsSection
            documents={processedDocuments}
            viewMode={viewMode}
            loading={loading}
            onOpenDocument={(id) => void openDocument(id)}
            onRenameDocument={handleOpenRenameModal}
            onDeleteDocument={(id) => handleOpenDeleteModal(id)}
            onCreateDocument={handleOpenCreateModal}
          />
        </PageContainer>
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
