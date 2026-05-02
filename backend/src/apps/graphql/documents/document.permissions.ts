import type { GraphqlAuthUser } from "../auth/auth.dto.js";
import { getGraphqlWorkspaceMembership } from "../workspaces/workspace.service.js";
import { getGraphqlDocumentCollaborators } from "./document.mapper.js";

type PermissionDocument = {
  ownerId: string;
  workspaceId: string;
  collaborators: unknown;
};

/** Determines whether a GraphQL user may view a document. */
export async function canGraphqlAccessDocument(
  document: PermissionDocument,
  userId: string,
): Promise<boolean> {
  if (document.ownerId === userId) {
    return true;
  }

  const collaborators = getGraphqlDocumentCollaborators(document.collaborators);

  if (collaborators.some((collaborator) => collaborator.id === userId)) {
    return true;
  }

  const membership = await getGraphqlWorkspaceMembership(document.workspaceId, userId);
  return Boolean(membership && !membership.workspace.isDefault);
}

/** Determines whether a GraphQL user may edit a document. */
export async function canGraphqlEditDocument(
  document: PermissionDocument,
  authUser: GraphqlAuthUser,
): Promise<boolean> {
  if (document.ownerId === authUser.id) {
    return true;
  }

  const collaborators = getGraphqlDocumentCollaborators(document.collaborators);
  const currentCollaborator = collaborators.find(
    (collaborator) => collaborator.id === authUser.id,
  );

  if (currentCollaborator?.role === "owner" || currentCollaborator?.role === "editor") {
    return true;
  }

  const membership = await getGraphqlWorkspaceMembership(document.workspaceId, authUser.id);

  return (
    !membership?.workspace.isDefault &&
    (membership?.role === "owner" || membership?.role === "editor")
  );
}
