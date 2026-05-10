import type { RestAuthUser } from "../auth/auth.dto.js";

type PermissionDocument = {
  ownerId: string;
};

export type RestDocumentCapabilities = {
  currentUserRole: "owner" | "editor" | "viewer" | null;
  canEdit: boolean;
  canShare: boolean;
  canDelete: boolean;
};

/** Determines whether a REST user may view a document. */
export function canRestAccessDocument(
  document: PermissionDocument,
  userId: string,
): boolean {
  return document.ownerId === userId;
}

/** Determines whether a REST user may edit a document. */
export function canRestEditDocument(
  document: PermissionDocument,
  authUser: RestAuthUser,
): boolean {
  return document.ownerId === authUser.id;
}

/** Computes the current user's document role and UI capabilities. */
export function getRestDocumentCapabilities(
  document: PermissionDocument,
  userId: string,
): RestDocumentCapabilities {
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
