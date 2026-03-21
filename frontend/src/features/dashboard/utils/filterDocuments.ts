import type { DashboardFilters } from "../store/dashboardStore";
import type { Document } from "../types/document.types";

function isDocumentEmpty(content: unknown): boolean {
  if (!content || typeof content !== "object") {
    return true;
  }

  const maybeDoc = content as { content?: unknown[] };

  if (!Array.isArray(maybeDoc.content) || maybeDoc.content.length === 0) {
    return true;
  }

  return false;
}

function isRecentlyOpened(lastOpenedAt?: string): boolean {
  if (!lastOpenedAt) return false;

  const openedAt = new Date(lastOpenedAt).getTime();
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  return openedAt >= sevenDaysAgo;
}

export function filterDocuments(
  documents: Document[],
  query: string,
  filters: DashboardFilters,
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
