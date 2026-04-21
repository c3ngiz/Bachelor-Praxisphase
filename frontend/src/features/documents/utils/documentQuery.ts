import type { Document } from "../types/document.types";

export type DocumentSortOption = "updated" | "created" | "title";

export type DocumentFilters = {
  author: string;
  onlyEmpty: boolean;
  onlyRecentlyOpened: boolean;
};

export const DEFAULT_DOCUMENT_FILTERS: DocumentFilters = {
  author: "all",
  onlyEmpty: false,
  onlyRecentlyOpened: false,
};

function isDocumentEmpty(content: unknown): boolean {
  if (!content || typeof content !== "object") {
    return true;
  }

  const maybeDoc = content as { content?: unknown[] };

  return !Array.isArray(maybeDoc.content) || maybeDoc.content.length === 0;
}

function isRecentlyOpened(lastOpenedAt?: string): boolean {
  if (!lastOpenedAt) {
    return false;
  }

  const openedAt = new Date(lastOpenedAt).getTime();
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  return openedAt >= sevenDaysAgo;
}

export function filterDocuments(
  documents: Document[],
  query: string,
  filters: DocumentFilters = DEFAULT_DOCUMENT_FILTERS,
): Document[] {
  const normalizedQuery = query.trim().toLowerCase();

  return documents.filter((doc) => {
    const matchesQuery = normalizedQuery
      ? doc.title.toLowerCase().includes(normalizedQuery)
      : true;

    const matchesAuthor =
      filters.author === "all" ? true : doc.author === filters.author;

    const matchesEmpty = filters.onlyEmpty
      ? isDocumentEmpty(doc.content)
      : true;

    const matchesRecentlyOpened = filters.onlyRecentlyOpened
      ? isRecentlyOpened(doc.lastOpenedAt)
      : true;

    return (
      matchesQuery && matchesAuthor && matchesEmpty && matchesRecentlyOpened
    );
  });
}

export function sortDocuments(
  documents: Document[],
  sort: DocumentSortOption,
): Document[] {
  const sorted = [...documents];

  switch (sort) {
    case "updated":
      return sorted.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );

    case "created":
      return sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    case "title":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));

    default:
      return sorted;
  }
}
