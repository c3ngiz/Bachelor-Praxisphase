import type { Document } from "@/features/documents";

export type DashboardCollectionId =
  | "all"
  | "shared"
  | "recent"
  | "activity"
  | "empty";

export type DashboardCollection = {
  id: DashboardCollectionId;
  label: string;
  description: string;
  documents: Document[];
};

function isDocumentEmpty(content: unknown): boolean {
  if (!content || typeof content !== "object") {
    return true;
  }

  const maybeDoc = content as { content?: unknown[] };

  return !Array.isArray(maybeDoc.content) || maybeDoc.content.length === 0;
}

function sortByDateDesc(
  documents: Document[],
  getDate: (document: Document) => string | undefined,
): Document[] {
  return [...documents].sort(
    (a, b) =>
      new Date(getDate(b) ?? 0).getTime() -
      new Date(getDate(a) ?? 0).getTime(),
  );
}

export function getDashboardCollections(
  documents: Document[],
  currentUserId: string | null,
): DashboardCollection[] {
  const sharedDocuments = currentUserId
    ? sortByDateDesc(
        documents.filter((doc) => {
          if (doc.visibility === "private") {
            return false;
          }

          const currentUserAccess = doc.collaborators?.some(
            (collaborator) => collaborator.id === currentUserId,
          );

          return currentUserAccess && doc.lastEditedById !== currentUserId;
        }),
        (document) => document.lastEditedAt ?? document.updatedAt,
      )
    : [];

  const activityDocuments = currentUserId
    ? sortByDateDesc(
        documents.filter(
          (doc) =>
            doc.visibility !== "private" &&
            doc.lastEditedById !== currentUserId,
        ),
        (document) => document.lastEditedAt ?? document.updatedAt,
      )
    : [];

  const recentDocuments = sortByDateDesc(
    documents,
    (document) =>
      document.lastOpenedAt ?? document.lastEditedAt ?? document.updatedAt,
  ).slice(0, 8);

  const emptyDocuments = documents.filter((doc) => isDocumentEmpty(doc.content));

  return [
    {
      id: "all",
      label: "All Documents",
      description: "Browse and manage every document in your workspace.",
      documents,
    },
    {
      id: "shared",
      label: "Shared with You",
      description: "Documents teammates recently shared or updated for you.",
      documents: sharedDocuments,
    },
    {
      id: "recent",
      label: "Recent",
      description: "Jump back into documents opened, touched, or edited most recently.",
      documents: recentDocuments,
    },
    {
      id: "activity",
      label: "Team Activity",
      description: "Documents your teammates edited across shared work.",
      documents: activityDocuments,
    },
    {
      id: "empty",
      label: "Empty Drafts",
      description: "Drafts that are ready for a first pass.",
      documents: emptyDocuments,
    },
  ];
}

export function getDashboardCollection(
  documents: Document[],
  currentUserId: string | null,
  collectionId: DashboardCollectionId,
): DashboardCollection {
  const collections = getDashboardCollections(documents, currentUserId);

  return (
    collections.find((collection) => collection.id === collectionId) ??
    collections[0]
  );
}
