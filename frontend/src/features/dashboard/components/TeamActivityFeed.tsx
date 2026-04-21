import { Clock3, FileText, PencilLine } from "lucide-react";

import Card from "@/shared/components/ui/Card";
import type { Document } from "@/features/documents";

type Props = {
  documents: Document[];
  onOpenDocument?: (documentId: string) => void;
};

function formatActivityDate(date?: string) {
  if (!date) return "Recently";

  return new Date(date).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * TeamActivityFeed component.
 */
export default function TeamActivityFeed({
  documents,
  onOpenDocument,
}: Props) {
  if (documents.length === 0) {
    return null;
  }

  return (
    <Card padding="none" shadow="sm" className="overflow-hidden">
      <div className="divide-y divide-(--border)">
        {documents.map((doc) => (
          <button
            key={doc.id}
            type="button"
            onClick={() => onOpenDocument?.(doc.id)}
            className="
              flex w-full items-start gap-4 px-4 py-4 text-left
              transition-colors hover:bg-(--bg)
            "
          >
            <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-(--border) bg-(--bg-subtle) text-(--fg-muted)">
              <PencilLine size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-sm font-semibold text-(--fg)">
                  {doc.lastEditedByName}
                </span>
                <span className="text-sm text-(--fg-muted)">edited</span>
                <span className="truncate text-sm font-medium text-(--fg)">
                  {doc.title}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-(--fg-muted)">
                <span className="inline-flex items-center gap-1">
                  <FileText size={13} />
                  {doc.visibility === "workspace"
                    ? "Team document"
                    : doc.visibility === "shared"
                      ? "Shared document"
                      : "Private document"}
                </span>

                <span className="inline-flex items-center gap-1">
                  <Clock3 size={13} />
                  {formatActivityDate(doc.lastEditedAt)}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}