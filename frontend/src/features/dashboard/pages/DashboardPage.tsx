import { useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardHeader from "../components/DashboardHeader";
import DocumentsContainer from "../components/DocumentsContainer";
import DocumentsEmptyState from "../components/DocumentsEmptyState";
import RecentDocuments from "../components/RecentDocuments";

import CreateDocumentModal from "../components/modals/CreateDocumentModal";
import RenameDocumentModal from "../components/modals/RenameDocumentModal";

import { useDocumentsStore } from "../store/documentsStore";

export default function DashboardPage() {
    const navigate = useNavigate();

    const {
        documents,
        createDocument,
        deleteDocument,
        updateDocument,
    } = useDocumentsStore();

    const [loading] = useState(false);

    // --- Modal State ---
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

    // --- Derived ---
    const selectedDocument = documents.find(
        (doc) => doc.id === selectedDocumentId
    );

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

    function handleDeleteDocument(id: string) {
        deleteDocument(id);
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
                    onDelete={handleDeleteDocument}
                    onCreate={handleOpenCreateModal}
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
        </div>
    );
}