import DocumentCard from "./DocumentCard";
import type { Document } from "../types";

type Props = {
  documents: Document[];
};

export default function DocumentList({ documents }: Props) {
  if (documents.length === 0) {
    return <div className="text-(--fg-muted)">No documents yet.</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {documents.map((doc) => (
        <DocumentCard key={doc.id} document={doc} />
      ))}
    </div>
  );
}