import type { Document } from "@/features/documents";
import { useDashboardSelectionState } from "../../hooks/useDashboardSelectionState";
import { Button, Table } from "@/shared/components/ui";

type Props = {
    document: Document;
    onOpen?: (id: string) => void;
    onRename?: (id: string) => void;
    onDelete?: (id: string) => void;
};

function formatDate(date: string) {
    return new Date(date).toLocaleDateString();
}

/**
 * DocumentRow component.
 */
export default function DocumentRow({
    document,
    onOpen,
    onRename,
    onDelete,
}: Props) {
    const { selectedDocuments, toggleSelection } = useDashboardSelectionState();

    const isSelected = selectedDocuments.has(document.id);
    const isSelectionMode = selectedDocuments.size > 0;

    return (
        <Table.Row selected={isSelected}>
            <Table.Cell>
                <div onClick={(event) => event.stopPropagation()}>
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(document.id)}
                        className="h-4 w-4 cursor-pointer accent-(--accent)"
                        aria-label={`Select document ${document.title}`}
                    />
                </div>
            </Table.Cell>

            <Table.Cell className="font-medium text-(--fg)">
                {document.title}
            </Table.Cell>

            <Table.Cell className="text-(--fg-muted)">
                {document.author}
            </Table.Cell>

            <Table.Cell className="text-(--fg-muted)">
                {formatDate(document.createdAt)}
            </Table.Cell>

            <Table.Cell className="text-(--fg-muted)">
                {formatDate(document.updatedAt)}
            </Table.Cell>

            <Table.Cell>
                <div className="flex gap-2">
                    <Button
                        variant="primary"
                        className="px-3 py-1 text-xs"
                        onClick={() => onOpen?.(document.id)}
                        disabled={isSelectionMode}
                    >
                        Open
                    </Button>

                    <Button
                        variant="secondary"
                        className="px-3 py-1 text-xs"
                        onClick={() => onRename?.(document.id)}
                        disabled={isSelectionMode}
                    >
                        Rename
                    </Button>

                    <Button
                        variant="ghost"
                        className="px-3 py-1 text-xs text-red-500"
                        onClick={() => onDelete?.(document.id)}
                        disabled={isSelectionMode}
                    >
                        Delete
                    </Button>
                </div>
            </Table.Cell>
        </Table.Row>
    );
}
