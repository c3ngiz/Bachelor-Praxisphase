import { FilePenLine, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Document } from "../types";

type Props = {
  document: Document;
  onRename: (document: Document) => void;
  onDelete: (document: Document) => void;
};

function getDocumentPreview(content?: string): string {
  const safeContent = typeof content === "string" ? content : "";

  if (!safeContent.trim()) {
    return "No preview available yet.";
  }

  if (typeof window !== "undefined" && typeof DOMParser !== "undefined") {
    const parser = new DOMParser();
    const doc = parser.parseFromString(safeContent, "text/html");
    const text = doc.body.textContent?.replace(/\s+/g, " ").trim() ?? "";

    if (!text) {
      return "No preview available yet.";
    }

    return text.length > 180 ? `${text.slice(0, 180).trim()}...` : text;
  }

  const stripped = safeContent
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!stripped) {
    return "No preview available yet.";
  }

  return stripped.length > 180
    ? `${stripped.slice(0, 180).trim()}...`
    : stripped;
}

function formatLastUpdated(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export default function DocumentCard({ document, onRename, onDelete }: Props) {
  const navigate = useNavigate();
  const preview = getDocumentPreview(document.content);

  return (
    <article className="w-full rounded-lg border border-(--border) bg-(--bg-elevated) p-5 text-left transition hover:border-(--accent) hover:shadow-md">
      <h3 className="text-lg font-semibold text-(--fg)">
        {document.title}
      </h3>

      <p className="mt-2 min-h-24 text-sm leading-relaxed text-(--fg-muted)">
        {preview}
      </p>

      <p className="mt-3 text-sm text-(--fg-muted)">
        Last updated: {formatLastUpdated(document.updatedAt)}
      </p>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onRename(document)}
          className="inline-flex items-center gap-1 rounded-md border border-(--border) px-2.5 py-1.5 text-xs text-(--fg-muted) transition hover:border-(--accent) hover:text-(--fg)"
          aria-label={`Rename ${document.title}`}
          title="Rename"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          Rename
        </button>

        <button
          type="button"
          onClick={() => navigate(`/document/${document.id}`)}
          className="inline-flex items-center gap-1 rounded-md border border-(--border) px-2.5 py-1.5 text-xs text-(--fg-muted) transition hover:border-(--accent) hover:text-(--fg)"
          aria-label={`Edit ${document.title}`}
          title="Edit"
        >
          <FilePenLine className="h-3.5 w-3.5" aria-hidden="true" />
          Edit
        </button>

        <button
          type="button"
          onClick={() => onDelete(document)}
          className="inline-flex items-center gap-1 rounded-md border border-(--border) px-2.5 py-1.5 text-xs text-(--fg-muted) transition hover:border-red-500 hover:text-red-500"
          aria-label={`Delete ${document.title}`}
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Delete
        </button>
      </div>
    </article>
  );
}