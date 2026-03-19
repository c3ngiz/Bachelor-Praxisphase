import type { Document } from "../../types/document.types";
import { useDashboardStore } from "../../store/dashboardStore";
import Button from "@/shared/components/ui/Button";

type Props = {
    document: Document;
    onOpen?: (id: string) => void;
    onRename?: (id: string) => void;
    onDelete?: (id: string) => void;
};

function formatDate(date: string) {
    return new Date(date).toLocaleDateString();
}

export default function DocumentRow({
    document,
    onOpen,
    onRename,
    onDelete,
}: Props) {
    const selectedDocuments = useDashboardStore((s) => s.selectedDocuments);
    const toggleSelection = useDashboardStore((s) => s.toggleSelection);

    const isSelected = selectedDocuments.has(document.id);
    const isSelectionMode = selectedDocuments.size > 0;

    return (
        <tr
            className={[
                "border-b border-(--border) hover:bg-(--bg)",
                isSelected ? "bg-[color:var(--accent)/0.10]" : "",
            ].join(" ")}
        >
            <td className="px-4 py-3">
                <div onClick={(event) => event.stopPropagation()}>
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(document.id)}
                        className="h-4 w-4 cursor-pointer accent-[var(--accent)]"
                        aria-label={`Select document ${document.title}`}
                    />
                </div>
            </td>

            <td className="px-4 py-3 font-medium text-(--fg)">{document.title}</td>

            <td className="px-4 py-3 text-(--fg-muted)">{document.author}</td>

            <td className="px-4 py-3 text-(--fg-muted)">
                {formatDate(document.createdAt)}
            </td>

            <td className="px-4 py-3 text-(--fg-muted)">
                {formatDate(document.updatedAt)}
            </td>

            <td className="px-4 py-3">
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
            </td>
        </tr>
    );
}