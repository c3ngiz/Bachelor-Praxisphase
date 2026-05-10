import type { GraphqlAuthUser } from "../auth/auth.dto.js";

type PermissionDocument = {
  ownerId: string;
};

export type GraphqlDocumentCapabilities = {
  currentUserRole: "owner" | "editor" | "viewer" | null;
  canEdit: boolean;
  canShare: boolean;
  canDelete: boolean;
};

/** Determines whether a GraphQL user may view a document. */
export function canGraphqlAccessDocument(
  document: PermissionDocument,
  userId: string,
): boolean {
  return document.ownerId === userId;
}

/** Determines whether a GraphQL user may edit a document. */
export function canGraphqlEditDocument(
  document: PermissionDocument,
  authUser: GraphqlAuthUser,
): boolean {
  return document.ownerId === authUser.id;
}

/** Computes the current user's document role and UI capabilities. */
export function getGraphqlDocumentCapabilities(
  document: PermissionDocument,
  userId: string,
): GraphqlDocumentCapabilities {
  if (document.ownerId === userId) {
    return {
      currentUserRole: "owner",
      canEdit: true,
      canShare: true,
      canDelete: true,
    };
  }

  return {
    currentUserRole: null,
    canEdit: false,
    canShare: false,
    canDelete: false,
  };
}
