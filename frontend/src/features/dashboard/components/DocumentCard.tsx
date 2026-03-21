import type { Document } from "../types/document.types";
import { useDashboardStore } from "../store/dashboardStore";
import Card from "@/shared/components/ui/Card";
import Button from "@/shared/components/ui/Button";
import { generateDocumentPreview } from "../utils/generateDocumentPreview";

type Props = {
    document: Document;
    onOpen?: (id: string) => void;
    onRename?: (id: string) => void;
    onDelete?: (id: string) => void;
};

function formatDate(date: string) {
    return new Date(date).toLocaleDateString();
}

export default function DocumentCard({
    document,
    onOpen,
    onRename,
    onDelete,
}: Props) {
    const selectedDocuments = useDashboardStore((s) => s.selectedDocuments);
    const toggleSelection = useDashboardStore((s) => s.toggleSelection);

    const selectedCount = useDashboardStore((s) => s.selectedDocuments.size);
    const isSelectionMode = selectedCount > 0;

    const isSelected = selectedDocuments.has(document.id);

    const preview = generateDocumentPreview(document.content);

    return (
        <Card selectable selected={isSelected}>

            {/* HEADER */}
            <Card.Header>
                <h3 className="text-sm font-semibold text-(--fg) line-clamp-2">
                    {document.title}
                </h3>

                <div onClick={(e) => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(document.id)}
                        className="mt-1 h-4 w-4 cursor-pointer accent-(--accent)"
                    />
                </div>
            </Card.Header>

            {/* CONTENT */}
            <Card.Content>

                {/* Preview */}
                <div className="text-sm text-(--fg-muted) line-clamp-4 leading-relaxed min-h-18">
                    {preview || "Empty document"}
                </div>

                {/* Meta */}
                <div className="flex flex-col text-xs text-(--fg-muted) gap-1">
                    <span>Author: {document.author}</span>
                    <span>Created: {formatDate(document.createdAt)}</span>
                    <span>Updated: {formatDate(document.updatedAt)}</span>
                </div>

            </Card.Content>

            {/* FOOTER */}
            <Card.Footer>
                <div className="flex items-center justify-between gap-2">

                    <Button
                        variant="primary"
                        className="flex-1"
                        onClick={() => onOpen?.(document.id)}
                        disabled={isSelectionMode}
                    >
                        Open
                    </Button>

                    <Button
                        variant="secondary"
                        className="px-3"
                        onClick={() => onRename?.(document.id)}
                        disabled={isSelectionMode}
                    >
                        Rename
                    </Button>

                    <Button
                        variant="ghost"
                        className="px-3 text-red-500"
                        onClick={() => onDelete?.(document.id)}
                        disabled={isSelectionMode}
                    >
                        Delete
                    </Button>

                </div>
            </Card.Footer>

        </Card>
    );
}