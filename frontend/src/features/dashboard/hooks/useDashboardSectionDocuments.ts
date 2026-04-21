import { useMemo } from "react";

import type { Document } from "@/features/documents";

type UseDashboardSectionDocumentsInput = {
  documents: Document[];
  currentUserId: string | null;
};

type UseDashboardSectionDocumentsResult = {
  sharedWithYouDocuments: Document[];
  teamActivityDocuments: Document[];
  recentDocuments: Document[];
};

/**
 * Derives dashboard section datasets from the full document collection.
 */
export function useDashboardSectionDocuments({
  documents,
  currentUserId,
}: UseDashboardSectionDocumentsInput): UseDashboardSectionDocumentsResult {
  const sharedWithYouDocuments = useMemo(() => {
    if (!currentUserId) {
      return [];
    }

    return [...documents]
      .filter((doc) => {
        if (doc.visibility === "private") {
          return false;
        }

        const currentUserAccess = doc.collaborators?.some(
          (collaborator) => collaborator.id === currentUserId,
        );

        return currentUserAccess && doc.lastEditedById !== currentUserId;
      })
      .sort(
        (a, b) =>
          new Date(b.lastEditedAt ?? b.updatedAt).getTime() -
          new Date(a.lastEditedAt ?? a.updatedAt).getTime(),
      )
      .slice(0, 3);
  }, [currentUserId, documents]);

  const teamActivityDocuments = useMemo(() => {
    if (!currentUserId) {
      return [];
    }

    return [...documents]
      .filter(
        (doc) =>
          doc.visibility !== "private" && doc.lastEditedById !== currentUserId,
      )
      .sort(
        (a, b) =>
          new Date(b.lastEditedAt ?? b.updatedAt).getTime() -
          new Date(a.lastEditedAt ?? a.updatedAt).getTime(),
      )
      .slice(0, 4);
  }, [currentUserId, documents]);

  const recentDocuments = useMemo(() => {
    return [...documents]
      .filter((doc) => !!doc.lastOpenedAt)
      .sort(
        (a, b) =>
          new Date(b.lastOpenedAt ?? 0).getTime() -
          new Date(a.lastOpenedAt ?? 0).getTime(),
      )
      .slice(0, 3);
  }, [documents]);

  return {
    sharedWithYouDocuments,
    teamActivityDocuments,
    recentDocuments,
  };
}
