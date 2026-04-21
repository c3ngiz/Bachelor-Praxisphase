import type { Document } from "../types/document.types";
import {
  filterDocuments,
  sortDocuments,
  type DocumentFilters,
  type DocumentSortOption,
} from "../utils/documentQuery";

export type SelectOption = {
  value: string;
  label: string;
};

export function selectDocumentAuthors(documents: Document[]): SelectOption[] {
  const authors = Array.from(new Set(documents.map((d) => d.author))).sort();

  return [
    { value: "all", label: "All authors" },
    ...authors.map((author) => ({ value: author, label: author })),
  ];
}

export function selectProcessedDocuments(
  documents: Document[],
  query: string,
  filters: DocumentFilters,
  sortBy: DocumentSortOption,
): Document[] {
  return sortDocuments(filterDocuments(documents, query, filters), sortBy);
}
