import { useDashboardStore } from "../../store/dashboardStore";
import type { Document } from "../../types/document.types";

type Props = {
    document: Document;
};

export default function DocumentCardHeader({ document }: Props) {
    const selectedDocuments = useDashboardStore((s) => s.selectedDocuments);
    const toggleSelection = useDashboardStore((s) => s.toggleSelection);

    const isSelected = selectedDocuments.has(document.id);

    return (
        <div className="flex items-start justify-between gap-2">
            <h3
                className="
        text-sm
        font-semibold
        text-(--fg)
        line-clamp-2
      "
            >
                {document.title}
            </h3>

            <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleSelection(document.id)}
                className="mt-1 h-4 w-4 cursor-pointer accent-[var(--accent)]"
            />
        </div>
    );
}