import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageContainer from "@/shared/components/layout/PageContainer";

import DocumentsContainer from "../components/DocumentsContainer";
import DocumentsEmptyState from "../components/DocumentsEmptyState";
import RecentDocuments from "../components/RecentDocuments";
import DashboardToolbar from "../components/DashboardToolbar";

import CreateDocumentModal from "../components/modals/CreateDocumentModal";
import RenameDocumentModal from "../components/modals/RenameDocumentModal";
import DeleteConfirmationModal from "../components/modals/DeleteConfirmationModal";
import MultiSelectToolbar from "../components/MultiSelectToolbar";

import { useDocumentsStore } from "../store/documentsStore";
import { useDocumentSelection } from "../hooks/useDocumentSelection";

import { useDashboardStore } from "../store/dashboardStore";
import { filterDocuments } from "../utils/filterDocuments";
import { sortDocuments } from "../utils/sortDocuments";

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

    const [loading] = useState(false);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
        null,
    );

    const selectedDocument = documents.find((doc) => doc.id === selectedDocumentId);
    const isBulkDelete = selectedCount > 0;

    const processedDocuments = useMemo(() => {
        const filtered = filterDocuments(documents, searchQuery, filters);
        return sortDocuments(filtered, sortBy);
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

    const isEmpty = processedDocuments.length === 0;

    return (
        <>
            <PageContainer title="Documents">
                <DashboardToolbar onCreate={handleOpenCreateModal} />

                <RecentDocuments onOpenDocument={handleOpenDocument} />

                {isEmpty ? (
                    <DocumentsEmptyState onCreateDocument={handleOpenCreateModal} />
                ) : (
                    <DocumentsContainer
                        documents={processedDocuments}
                        loading={loading}
                        onOpen={handleOpenDocument}
                        onRename={handleOpenRenameModal}
                        onDelete={(id) => handleOpenDeleteModal(id)}
                        onCreate={handleOpenCreateModal}
                    />
                )}
            </PageContainer>

            {selectedCount > 0 && (
                <MultiSelectToolbar
                    count={selectedCount}
                    onClear={clearSelection}
                    onDelete={() => handleOpenDeleteModal()}
                />
            )}

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