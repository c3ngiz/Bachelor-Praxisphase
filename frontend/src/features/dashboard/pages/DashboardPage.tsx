import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageContainer from "@/shared/components/layout/PageContainer";
import Section from "@/shared/components/layout/Section";
import SectionHeader from "@/shared/components/layout/SectionHeader";

import DashboardLayout from "../components/DashboardLayout";
import DocumentsContainer from "../components/DocumentsContainer";
import RecentDocuments from "../components/RecentDocuments";

import CreateDocumentModal from "../components/modals/CreateDocumentModal";
import RenameDocumentModal from "../components/modals/RenameDocumentModal";
import DeleteConfirmationModal from "../components/modals/DeleteConfirmationModal";
import MultiSelectToolbar from "../components/MultiSelectToolbar";

import { useDocumentsStore } from "../store/documentsStore";
import { useDocumentSelection } from "../hooks/useDocumentSelection";

import { useDashboardStore } from "../store/dashboardStore";
import { filterDocuments } from "../utils/filterDocuments";
import { sortDocuments } from "../utils/sortDocuments";

import SortDropdown from "../components/toolbar/SortDropdown";
import FilterDropdown from "../components/toolbar/FilterDropdown";
import ViewDropdown from "../components/toolbar/ViewDropdown";

export default function DashboardPage() {
    const navigate = useNavigate();

    const {
        documents,
        createDocument,
        deleteDocument,
        deleteDocuments,
        updateDocument,
    } = useDocumentsStore();

    const { selectedDocuments, selectedCount, clearSelection } =
        useDocumentSelection();

    const searchQuery = useDashboardStore((s) => s.searchQuery);
    const sortBy = useDashboardStore((s) => s.sortBy);
    const filters = useDashboardStore((s) => s.filters);
    const viewMode = useDashboardStore((s) => s.viewMode);

    const [loading] = useState(false);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
        null,
    );

    const selectedDocument = documents.find((doc) => doc.id === selectedDocumentId);
    const isBulkDelete = selectedCount > 0;

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
        setIsCreateOpen(true);
    }

    function handleCreateDocument(name: string) {
        const newDoc = createDocument(name);
        navigate(`/document/${newDoc.id}`);
    }

    function handleOpenDocument(id: string) {
        const doc = documents.find((document) => document.id === id);
        if (!doc) return;

        clearSelection();

        updateDocument({
            ...doc,
            lastOpenedAt: new Date().toISOString(),
        });

        navigate(`/document/${id}`);
    }

    function handleOpenRenameModal(id: string) {
        setSelectedDocumentId(id);
        setIsRenameOpen(true);
    }

    function handleRenameDocument(newName: string) {
        if (!selectedDocument) return;

        updateDocument({
            ...selectedDocument,
            title: newName,
            updatedAt: new Date().toISOString(),
        });
    }

    function handleOpenDeleteModal(id?: string) {
        if (id) {
            setSelectedDocumentId(id);
        } else {
            setSelectedDocumentId(null);
        }

        setIsDeleteOpen(true);
    }

    function handleConfirmDelete() {
        if (isBulkDelete) {
            deleteDocuments(Array.from(selectedDocuments));
            clearSelection();
        } else if (selectedDocumentId) {
            deleteDocument(selectedDocumentId);
        }

        setSelectedDocumentId(null);
    }

    return (
        <>
            <DashboardLayout documents={documents}>
                <PageContainer title="">
                    {recentDocuments.length > 0 ? (
                        <Section>
                            <SectionHeader
                                title="Recent Documents"
                                description="Jump back into the documents you opened most recently"
                            />

                            <RecentDocuments
                                documents={recentDocuments}
                                onOpenDocument={handleOpenDocument}
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
                            onOpen={handleOpenDocument}
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
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleConfirmDelete}
                documentTitle={selectedDocument?.title}
                bulkCount={isBulkDelete ? selectedCount : 0}
            />
        </>
    );
}