import { Database, FileText, Users } from "lucide-react";
import type { Document } from "../types/document.types";

type Props = {
  documents: Document[];
};

function formatDateTime(date?: string) {
  if (!date) return "No recent activity";

  return new Date(date).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function DashboardFooterStrip({ documents }: Props) {
  const lastOpenedDocument = [...documents]
    .filter((doc) => !!doc.lastOpenedAt)
    .sort(
      (a, b) =>
        new Date(b.lastOpenedAt ?? 0).getTime() -
        new Date(a.lastOpenedAt ?? 0).getTime(),
    )[0];

  const sharedDocumentsCount = documents.filter(
    (doc) => doc.visibility !== "private",
  ).length;

  return (
    <div
      className="
        relative z-0
        flex flex-col gap-3 rounded-xl border border-(--border)
        bg-(--bg-elevated)/95 px-4 py-3
        text-sm text-(--fg-muted) shadow-sm backdrop-blur
        md:flex-row md:items-center md:justify-between
      "
    >
      <div className="flex items-center gap-2">
        <Database size={16} className="shrink-0" />
        <span>
          <span className="font-medium text-(--fg)">{documents.length}</span>{" "}
          {documents.length === 1 ? "document" : "documents"}
        </span>
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <FileText size={16} className="shrink-0" />
        <span className="truncate">
          {lastOpenedDocument ? (
            <>
              Last opened:{" "}
              <span className="font-medium text-(--fg)">
                {lastOpenedDocument.title}
              </span>{" "}
              <span className="whitespace-nowrap">
                • {formatDateTime(lastOpenedDocument.lastOpenedAt)}
              </span>
            </>
          ) : (
            "No document opened yet"
          )}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Users size={16} className="shrink-0" />
        <span>
          <span className="font-medium text-(--fg)">{sharedDocumentsCount}</span>{" "}
          shared in workspace
        </span>
      </div>
    </div>
  );
}