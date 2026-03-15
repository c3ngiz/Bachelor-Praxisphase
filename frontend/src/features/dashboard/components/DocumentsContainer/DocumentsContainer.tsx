import { useDashboardStore } from "../../store/dashboardStore";
import { useDocumentSearch } from "../../hooks/useDocumentSearch";

import DocumentsGrid from "../DocumentsGrid";
import DocumentsTable from "../DocumentsTable";
import DocumentsEmptyState from "../DocumentsEmptyState";

import DocumentSkeletonGrid from "../DocumentSkeleton/DocumentSkeletonGrid";
import DocumentSkeletonList from "../DocumentSkeleton/DocumentSkeletonList";

type Props = {
    loading?: boolean;

    onOpen?: (id: string) => void;
    onRename?: (id: string) => void;
    onDelete?: (id: string) => void;
};

export default function DocumentsContainer({
    loading,
    onOpen,
    onRename,
    onDelete,
}: Props) {
    const documents = useDashboardStore((s) => s.documents);
    const query = useDashboardStore((s) => s.searchQuery);
    const viewMode = useDashboardStore((s) => s.viewMode);

    const filteredDocuments = useDocumentSearch(documents, query);

    if (loading) {
        return viewMode === "grid" ? (
            <DocumentSkeletonGrid />
        ) : (
            <DocumentSkeletonList />
        );
    }

    if (filteredDocuments.length === 0) {
        return <DocumentsEmptyState />;
    }

    if (viewMode === "grid") {
        return (
            <DocumentsGrid
                documents={filteredDocuments}
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