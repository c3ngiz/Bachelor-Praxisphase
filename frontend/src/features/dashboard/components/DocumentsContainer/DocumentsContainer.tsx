import { useDocumentSearch } from "../../hooks/useDocumentSearch";
import { useDashboardStore } from "../../store/dashboardStore";
import type { Document } from "../../types/document.types";

import DocumentsEmptyState from "../DocumentsEmptyState";
import DocumentsGrid from "../DocumentsGrid";
import DocumentSkeletonGrid from "../DocumentSkeleton/DocumentSkeletonGrid";
import DocumentSkeletonList from "../DocumentSkeleton/DocumentSkeletonList";
import DocumentsTable from "../DocumentsTable";

type Props = {
    documents: Document[];
    loading?: boolean;
    onOpen?: (id: string) => void;
    onRename?: (id: string) => void;
    onDelete?: (id: string) => void;
    onCreate?: () => void;
};

export default function DocumentsContainer({
    documents,
    loading,
    onOpen,
    onRename,
    onDelete,
    onCreate,
}: Props) {
    const query = useDashboardStore((state) => state.searchQuery);
    const filters = useDashboardStore((state) => state.filters);
    const viewMode = useDashboardStore((state) => state.viewMode);

    const filteredDocuments = useDocumentSearch(documents, query, filters);

    if (loading) {
        return viewMode === "grid" ? (
            <DocumentSkeletonGrid />
        ) : (
            <DocumentSkeletonList />
        );
    }

    if (filteredDocuments.length === 0) {
        return <DocumentsEmptyState onCreateDocument={onCreate} />;
    }

    if (viewMode === "grid") {
        return (
            <DocumentsGrid
                documents={filteredDocuments}
                onOpen={onOpen}
                onRename={onRename}
                onDelete={onDelete}
                onCreate={onCreate}
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