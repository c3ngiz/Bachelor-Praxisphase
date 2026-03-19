import { useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardHeader from "../components/DashboardHeader";
import DocumentsContainer from "../components/DocumentsContainer";
import DocumentsEmptyState from "../components/DocumentsEmptyState";
import RecentDocuments from "../components/RecentDocuments";

import CreateDocumentModal from "../components/modals/CreateDocumentModal";
import RenameDocumentModal from "../components/modals/RenameDocumentModal";
import DeleteConfirmationModal from "../components/modals/DeleteConfirmationModal";
import MultiSelectToolbar from "../components/MultiSelectToolbar";

import { useDocumentsStore } from "../store/documentsStore";
import { useDocumentSelection } from "../hooks/useDocumentSelection";

export default function DashboardPage() {
    const navigate = useNavigate();

    const {
        documents,
        createDocument,
        deleteDocument,
        deleteDocuments,
        updateDocument,
    } = useDocumentsStore();

    const {
        selectedDocuments,
        selectedCount,
        clearSelection,
    } = useDocumentSelection();

    const [loading] = useState(false);

    // --- Modal State ---
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

    // --- Derived ---
    const selectedDocument = documents.find(
        (doc) => doc.id === selectedDocumentId
    );

    const isBulkDelete = selectedCount > 0;

    // --- Handlers ---
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

    const isEmpty = documents.length === 0;

    return (
        <div className="flex min-h-screen flex-col">
            <DashboardHeader />

            <RecentDocuments onOpenDocument={handleOpenDocument} />

            {isEmpty ? (
                <DocumentsEmptyState onCreateDocument={handleOpenCreateModal} />
            ) : (
                <DocumentsContainer
                    documents={documents}
                    loading={loading}
                    onOpen={handleOpenDocument}
                    onRename={handleOpenRenameModal}
                    onDelete={(id) => handleOpenDeleteModal(id)}
                    onCreate={handleOpenCreateModal}
                />
            )}

            {/* --- Multi Select Toolbar --- */}
            {selectedCount > 0 && (
                <MultiSelectToolbar
                    count={selectedCount}
                    onClear={clearSelection}
                    onDelete={() => handleOpenDeleteModal()}
                />
            )}

            {/* --- Modals --- */}

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
                documentTitle={
                    isBulkDelete
                        ? `${selectedCount} documents`
                        : selectedDocument?.title
                }
            />
        </div>
    );
}