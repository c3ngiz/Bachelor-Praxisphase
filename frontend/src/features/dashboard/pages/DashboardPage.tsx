import { useEffect, useState } from "react";

import DashboardHeader from "../components/DashboardHeader";
import RecentDocuments from "../components/RecentDocuments";
import DocumentsContainer from "../components/DocumentsContainer";

import { useDashboardStore } from "../store/dashboardStore";
import type { Document } from "../types/document.types";

/**
 * Temporary mock data until backend exists
 */
function createMockDocuments(): Document[] {
    const now = new Date().toISOString();

    return [
        {
            id: "1",
            title: "Project Proposal",
            author: "Alice",
            createdAt: now,
            updatedAt: now,
            lastOpenedAt: now,
            content: {
                type: "doc",
                content: [
                    {
                        type: "paragraph",
                        content: [{ type: "text", text: "Project proposal draft..." }],
                    },
                ],
            },
        },
        {
            id: "2",
            title: "Meeting Notes",
            author: "Bob",
            createdAt: now,
            updatedAt: now,
            lastOpenedAt: now,
            content: {
                type: "doc",
                content: [
                    {
                        type: "paragraph",
                        content: [{ type: "text", text: "Meeting notes from yesterday." }],
                    },
                ],
            },
        },
        {
            id: "3",
            title: "Research Document",
            author: "Charlie",
            createdAt: now,
            updatedAt: now,
            content: {
                type: "doc",
                content: [
                    {
                        type: "paragraph",
                        content: [{ type: "text", text: "Initial research ideas." }],
                    },
                ],
            },
        },
    ];
}

export default function DashboardPage() {
    const setDocuments = useDashboardStore((s) => s.setDocuments);
    const documents = useDashboardStore((s) => s.documents);

    const [loading, setLoading] = useState(true);

    /**
     * Simulate document loading
     */
    useEffect(() => {
        const timeout = setTimeout(() => {
            const docs = createMockDocuments();
            setDocuments(docs);
            setLoading(false);
        }, 600);

        return () => clearTimeout(timeout);
    }, [setDocuments]);

    /**
     * Document actions
     */
    function handleOpenDocument(id: string) {
        console.log("Open document:", id);

        // Later:
        // navigate(`/documents/${id}`)
    }

    function handleRenameDocument(id: string) {
        console.log("Rename document:", id);
    }

    function handleDeleteDocument(id: string) {
        console.log("Delete document:", id);
    }

    function handleCreateDocument() {
        console.log("Create new document");
    }

    return (
        <div className="flex min-h-screen flex-col">
            <DashboardHeader />

            <RecentDocuments onOpenDocument={handleOpenDocument} />

            <DocumentsContainer
                loading={loading}
                onOpen={handleOpenDocument}
                onRename={handleRenameDocument}
                onDelete={handleDeleteDocument}
            />
        </div>
    );
}