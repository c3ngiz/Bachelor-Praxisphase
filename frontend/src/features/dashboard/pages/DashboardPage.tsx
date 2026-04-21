import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageContainer from "@/shared/components/layout/PageContainer";
import Section from "@/shared/components/layout/Section";
import SectionHeader from "@/shared/components/layout/SectionHeader";
import { useAuth } from "@/features/auth/hooks/useAuth";

import DashboardLayout from "../components/DashboardLayout";
import DocumentsContainer from "../components/DocumentsContainer";
import RecentDocuments from "../components/RecentDocuments";
import SharedWithYouDocuments from "../components/SharedWithYouDocuments";
import TeamActivityFeed from "../components/TeamActivityFeed";

import CreateDocumentModal from "../components/modals/CreateDocumentModal";
import RenameDocumentModal from "../components/modals/RenameDocumentModal";
import DeleteConfirmationModal from "../components/modals/DeleteConfirmationModal";
import MultiSelectToolbar from "../components/MultiSelectToolbar";

import { useDocumentsStore } from "@/features/documents";
import { useDocumentSelection } from "../hooks/useDocumentSelection";

import { useDashboardStore } from "../store/dashboardStore";
import { filterDocuments } from "../utils/filterDocuments";
import { sortDocuments } from "../utils/sortDocuments";

import SortDropdown from "../components/toolbar/SortDropdown";
import FilterDropdown from "../components/toolbar/FilterDropdown";
import ViewDropdown from "../components/toolbar/ViewDropdown";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { token, user, isLoading: isAuthLoading } = useAuth();

  const {
    documents,
    isLoading,
    error,
    loadDocuments,
    createDocument,
    deleteDocument,
    deleteDocuments,
    updateDocument,
    clearError,
  } = useDocumentsStore();

  const { selectedDocuments, selectedCount, clearSelection } =
    useDocumentSelection();

  const searchQuery = useDashboardStore((s) => s.searchQuery);
  const sortBy = useDashboardStore((s) => s.sortBy);
  const filters = useDashboardStore((s) => s.filters);
  const viewMode = useDashboardStore((s) => s.viewMode);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const currentUserId = user?.id ?? null;

  useEffect(() => {
    if (!token) return;
    void loadDocuments(token);
  }, [token, loadDocuments]);

  const selectedDocument = documents.find((doc) => doc.id === selectedDocumentId);

  const selectedDocumentIds = useMemo(() => {
    return Array.from(selectedDocuments);
  }, [selectedDocuments]);

  const singleSelectedDocumentId =
    selectedCount === 1 ? selectedDocumentIds[0] : null;

  const isBulkDelete = selectedCount > 1;

  const sharedWithYouDocuments = useMemo(() => {
    if (!currentUserId) {
      return [];
    }

    return [...documents]
      .filter((doc) => {
        if (doc.visibility === "private") {
          return false;
        }

        const currentUserAccess = doc.collaborators?.some(
          (collaborator) => collaborator.id === currentUserId,
        );

        return currentUserAccess && doc.lastEditedById !== currentUserId;
      })
      .sort(
        (a, b) =>
          new Date(b.lastEditedAt ?? b.updatedAt).getTime() -
          new Date(a.lastEditedAt ?? a.updatedAt).getTime(),
      )
      .slice(0, 3);
  }, [currentUserId, documents]);

  const teamActivityDocuments = useMemo(() => {
    if (!currentUserId) {
      return [];
    }

    return [...documents]
      .filter(
        (doc) => doc.visibility !== "private" && doc.lastEditedById !== currentUserId,
      )
      .sort(
        (a, b) =>
          new Date(b.lastEditedAt ?? b.updatedAt).getTime() -
          new Date(a.lastEditedAt ?? a.updatedAt).getTime(),
      )
      .slice(0, 4);
  }, [currentUserId, documents]);

  const recentDocuments = useMemo(() => {
    return [...documents]
      .filter((doc) => !!doc.lastOpenedAt)
      .sort(
        (a, b) =>
          new Date(b.lastOpenedAt ?? 0).getTime() -
          new Date(a.lastOpenedAt ?? 0).getTime(),
      )
      .slice(0, 3);
  }, [documents]);

  const processedDocuments = useMemo(() => {
    const filteredDocuments = filterDocuments(documents, searchQuery, filters);
    return sortDocuments(filteredDocuments, sortBy);
  }, [documents, searchQuery, filters, sortBy]);

  function handleOpenCreateModal() {
    clearError();
    setIsCreateOpen(true);
  }

  async function handleCreateDocument(name: string) {
    if (!token) {
      throw new Error("You must be signed in to create documents.");
    }

    const newDoc = await createDocument(name, token);
    navigate(`/document/${newDoc.id}`);
  }

  async function handleOpenDocument(id: string) {
    const doc = documents.find((document) => document.id === id);
    if (!doc || !token) return;

    clearSelection();

    try {
      await updateDocument(
        doc.id,
        {
          lastOpenedAt: new Date().toISOString(),
        },
        token,
      );
    } catch {
      // Non-blocking: allow navigation even if the last-opened timestamp fails.
    }

    navigate(`/document/${id}`);
  }

  function handleOpenRenameModal(id: string) {
    clearError();
    setSelectedDocumentId(id);
    setIsRenameOpen(true);
  }

  async function handleRenameDocument(newName: string) {
    if (!selectedDocument || !token) {
      throw new Error("You must be signed in to rename documents.");
    }

    await updateDocument(
      selectedDocument.id,
      {
        title: newName,
      },
      token,
    );
  }

  function handleOpenDeleteModal(id?: string) {
    clearError();

    if (id) {
      setSelectedDocumentId(id);
    } else if (selectedCount === 1 && singleSelectedDocumentId) {
      setSelectedDocumentId(singleSelectedDocumentId);
    } else {
      setSelectedDocumentId(null);
    }

    setIsDeleteOpen(true);
  }

  async function handleConfirmDelete() {
    if (!token) {
      throw new Error("You must be signed in to delete documents.");
    }

    if (selectedCount > 1) {
      await deleteDocuments(selectedDocumentIds, token);
      clearSelection();
    } else if (selectedDocumentId) {
      await deleteDocument(selectedDocumentId, token);
      clearSelection();
    }

    setSelectedDocumentId(null);
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

          {sharedWithYouDocuments.length > 0 ? (
            <Section>
              <SectionHeader
                title="Shared with You"
                description="Documents teammates recently shared or updated for you"
              />

              <SharedWithYouDocuments
                documents={sharedWithYouDocuments}
                currentUserId={currentUserId}
                onOpenDocument={(id) => void handleOpenDocument(id)}
              />
            </Section>
          ) : null}

          {teamActivityDocuments.length > 0 ? (
            <Section>
              <SectionHeader
                title="Recent Team Activity"
                description="See what your teammates edited across shared documents"
              />

              <TeamActivityFeed
                documents={teamActivityDocuments}
                onOpenDocument={(id) => void handleOpenDocument(id)}
              />
            </Section>
          ) : null}

          {recentDocuments.length > 0 ? (
            <Section>
              <SectionHeader
                title="Your Recent Documents"
                description="Jump back into the documents you opened most recently"
              />

              <RecentDocuments
                documents={recentDocuments}
                onOpenDocument={(id) => void handleOpenDocument(id)}
              />
            </Section>
          ) : null}

          <Section variant="subtle" fullBleed>
            <SectionHeader
              title="All Documents"
              description="Browse and manage your documents"
              right={
                <div
                  className="
                    flex h-11 items-center gap-1 rounded-xl border border-(--border)
                    bg-(--bg-elevated) p-1
                    shadow-[0_2px_8px_rgba(60,64,67,0.08)]
                  "
                >
                  <SortDropdown />
                  <FilterDropdown />
                  <ViewDropdown />
                </div>
              }
            />

            <DocumentsContainer
              documents={processedDocuments}
              viewMode={viewMode}
              loading={loading}
              onOpen={(id) => void handleOpenDocument(id)}
              onRename={handleOpenRenameModal}
              onDelete={(id) => handleOpenDeleteModal(id)}
              onCreate={handleOpenCreateModal}
            />
          </Section>
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
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreateDocument}
      />

      <RenameDocumentModal
        isOpen={isRenameOpen}
        onClose={() => setIsRenameOpen(false)}
        currentName={selectedDocument?.title ?? ""}
        onRename={handleRenameDocument}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedDocumentId(null);
        }}
        onConfirm={handleConfirmDelete}
        documentTitle={selectedDocument?.title}
        bulkCount={isBulkDelete ? selectedCount : 0}
      />
    </>
  );
}
