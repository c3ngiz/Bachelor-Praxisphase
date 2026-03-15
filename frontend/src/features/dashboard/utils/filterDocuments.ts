import type { Document } from "../types/document.types";

export function filterDocuments(
  documents: Document[],
  query: string,
): Document[] {
  if (!query.trim()) {
    return documents;
  }

  const normalizedQuery = query.toLowerCase();

  return documents.filter((doc) =>
    doc.title.toLowerCase().includes(normalizedQuery),
  );
}
