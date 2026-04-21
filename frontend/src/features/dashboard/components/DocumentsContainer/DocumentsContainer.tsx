import type { Document } from "@/features/documents";

import DocumentsEmptyState from "../DocumentsEmptyState";
import DocumentsGrid from "../DocumentsGrid";
import DocumentSkeletonGrid from "../DocumentSkeleton/DocumentSkeletonGrid";
import DocumentSkeletonList from "../DocumentSkeleton/DocumentSkeletonList";
import DocumentsTable from "../DocumentsTable";

type ViewMode = "grid" | "list";

type Props = {
    documents: Document[];
    viewMode: ViewMode;
    loading?: boolean;
    onOpen?: (id: string) => void;
    onRename?: (id: string) => void;
    onDelete?: (id: string) => void;
    onCreate?: () => void;
};

export default function DocumentsContainer({
    documents,
    viewMode,
    loading,
    onOpen,
    onRename,
    onDelete,
    onCreate,
}: Props) {
    if (loading) {
        return viewMode === "grid" ? (
            <DocumentSkeletonGrid />
        ) : (
            <DocumentSkeletonList />
        );
    }

    if (documents.length === 0) {
        return <DocumentsEmptyState onCreateDocument={onCreate} />;
    }

    if (viewMode === "grid") {
        return (
            <DocumentsGrid
                documents={documents}
                onOpen={onOpen}
                onRename={onRename}
                onDelete={onDelete}
                onCreate={onCreate}
            />
        );
    }

    return (
        <DocumentsTable
            documents={documents}
            onOpen={onOpen}
            onRename={onRename}
            onDelete={onDelete}
        />
    );
}