import { useDashboardStore } from "../../store/dashboardStore";
import { useDocumentSearch } from "../../hooks/useDocumentSearch";

import DocumentsGrid from "../DocumentsGrid";
import DocumentsTable from "../DocumentsTable";
import DocumentsEmptyState from "../DocumentsEmptyState";

import DocumentSkeletonGrid from "../DocumentSkeleton/DocumentSkeletonGrid";
import DocumentSkeletonList from "../DocumentSkeleton/DocumentSkeletonList";

import type { Document } from "../../types/document.types";

type Props = {
    documents: Document[];
    loading?: boolean;

    onOpen?: (id: string) => void;
    onRename?: (id: string) => void;
    onDelete?: (id: string) => void;
};

export default function DocumentsContainer({
    documents,
    loading,
    onOpen,
    onRename,
    onDelete,
}: Props) {
    const query = useDashboardStore((s) => s.searchQuery);
    const viewMode = useDashboardStore((s) => s.viewMode);

    const filteredDocuments = useDocumentSearch(documents, query);

    if (loading) {
        return viewMode === "grid"
            ? <DocumentSkeletonGrid />
            : <DocumentSkeletonList />;
    }

    if (filteredDocuments.length === 0) {
        return <DocumentsEmptyState />;
    }

    if (viewMode === "grid") {
        return (
            <DocumentsGrid
                documents={filteredDocuments}
                onOpen={onOpen}
                onRename={onRename}
                onDelete={onDelete}
            />
        );
    }

    return (
        <DocumentsTable
            documents={filteredDocuments}
            onOpen={onOpen}
            onRename={onRename}
            onDelete={onDelete}
        />
    );
}