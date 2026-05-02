import type { RestAuthUser } from "../auth/auth.dto.js";
import { getRestWorkspaceMembership } from "../workspaces/workspace.service.js";
import { getRestDocumentCollaborators } from "./document.mapper.js";

type PermissionDocument = {
  ownerId: string;
  workspaceId: string;
  collaborators: unknown;
};

/** Determines whether a REST user may view a document. */
export async function canRestAccessDocument(
  document: PermissionDocument,
  userId: string,
): Promise<boolean> {
  if (document.ownerId === userId) {
    return true;
  }

  const collaborators = getRestDocumentCollaborators(document.collaborators);

  if (collaborators.some((collaborator) => collaborator.id === userId)) {
    return true;
  }

  const membership = await getRestWorkspaceMembership(document.workspaceId, userId);
  return Boolean(membership && !membership.workspace.isDefault);
}

/** Determines whether a REST user may edit a document. */
export async function canRestEditDocument(
  document: PermissionDocument,
  authUser: RestAuthUser,
): Promise<boolean> {
  if (document.ownerId === authUser.id) {
    return true;
  }

  const collaborators = getRestDocumentCollaborators(document.collaborators);
  const currentCollaborator = collaborators.find(
    (collaborator) => collaborator.id === authUser.id,
  );

  if (currentCollaborator?.role === "owner" || currentCollaborator?.role === "editor") {
    return true;
  }

  const membership = await getRestWorkspaceMembership(document.workspaceId, authUser.id);

  return (
    !membership?.workspace.isDefault &&
    (membership?.role === "owner" || membership?.role === "editor")
  );
}
