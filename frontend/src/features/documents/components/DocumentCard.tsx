import { useNavigate } from "react-router-dom";
import type { Document } from "../types";

type Props = {
  document: Document;
};

export default function DocumentCard({ document }: Props) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/document/${document.id}`)}
      className="w-full rounded-lg border border-(--border) bg-(--bg-elevated) p-5 text-left transition hover:border-(--accent) hover:shadow-md"
    >
      <h3 className="text-lg font-semibold text-(--fg)">
        {document.title}
      </h3>

      <p className="mt-2 text-sm text-(--fg-muted)">
        Last updated: {document.updatedAt}
      </p>
    </button>
  );
}