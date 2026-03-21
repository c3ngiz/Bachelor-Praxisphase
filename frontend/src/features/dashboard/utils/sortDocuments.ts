import type { Document } from "../types/document.types";

export type SortOption = "updated" | "created" | "title";

export function sortDocuments(
  documents: Document[],
  sort: SortOption,
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
