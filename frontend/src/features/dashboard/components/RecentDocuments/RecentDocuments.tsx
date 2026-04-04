import { Clock3, FileText } from "lucide-react";

import type { Document } from "../../types/document.types";

type Props = {
    documents: Document[];
    onOpenDocument?: (documentId: string) => void;
};

function formatRecentDate(date?: string) {
    if (!date) return "Never opened";

    return new Date(date).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

export default function RecentDocuments({
    documents,
    onOpenDocument,
}: Props) {
    if (documents.length === 0) {
        return null;
    }

    return (
        <div className="grid gap-4 md:grid-cols-3">
            {documents.map((doc) => (
                <button
                    key={doc.id}
                    type="button"
                    onClick={() => onOpenDocument?.(doc.id)}
                    className="
            group flex min-h-28 flex-col items-start justify-between rounded-xl
            border border-(--border) bg-(--bg-elevated) p-4 text-left
            shadow-[0_1px_2px_rgba(15,23,42,0.04)]
            transition-[border-color,box-shadow,transform] duration-150
            hover:border-[color:color-mix(in_srgb,var(--border)_68%,var(--fg)_32%)]
            hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)]
            focus:outline-none focus:ring-2 focus:ring-(--focus-ring)
          "
                >
                    <div className="flex w-full items-start justify-between gap-3">
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-(--bg-subtle) text-(--fg-muted)">
                            <FileText size={18} />
                        </div>

                        <span className="rounded-lg bg-(--bg-subtle) px-2 py-1 text-xs font-medium text-(--fg-muted)">
                            Recent
                        </span>
                    </div>

                    <div className="mt-4 min-w-0">
                        <h3 className="truncate text-sm font-semibold text-(--fg)">
                            {doc.title}
                        </h3>

                        <div className="mt-2 flex items-center gap-2 text-xs text-(--fg-muted)">
                            <Clock3 size={14} className="shrink-0" />
                            <span className="truncate">{formatRecentDate(doc.lastOpenedAt)}</span>
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
}