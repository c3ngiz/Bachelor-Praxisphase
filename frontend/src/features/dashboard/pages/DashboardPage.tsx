import { useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardHeader from "../components/DashboardHeader";
import RecentDocuments from "../components/RecentDocuments";
import DocumentsContainer from "../components/DocumentsContainer";
import DocumentsEmptyState from "../components/DocumentsEmptyState";

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

    function handleCreateDocument() {
        const newDoc = createDocument("Untitled Document");

        console.log("Created:", newDoc.id);
    }

    function handleOpenDocument(id: string) {
        const doc = documents.find((d) => d.id === id);
        if (!doc) return;

        updateDocument({
            ...doc,
            lastOpenedAt: new Date().toISOString(),
        });

        navigate(`/document/${id}`);
    }

    function handleRenameDocument(id: string) {
        const doc = documents.find((d) => d.id === id);
        if (!doc) return;

        const newTitle = prompt("New title", doc.title);
        if (!newTitle) return;

        updateDocument({
            ...doc,
            title: newTitle,
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
                <DocumentsEmptyState onCreateDocument={handleCreateDocument} />
            ) : (
                <DocumentsContainer
                    documents={documents}
                    loading={loading}
                    onOpen={handleOpenDocument}
                    onRename={handleRenameDocument}
                    onDelete={handleDeleteDocument}
                />
            )}
        </div>
    );
}