import type { GraphqlAuthUser } from "../auth/auth.dto.js";
import type {
  GraphqlCreateDocumentInput,
  GraphqlDocument,
  GraphqlInviteDocumentCollaboratorInput,
  GraphqlUpdateDocumentInput,
} from "./document.dto.js";
import {
  createDocument,
  deleteLegacyDocument,
  getLegacyDocument,
  inviteLegacyDocumentCollaborator,
  listLegacyDocuments,
  updateLegacyDocument,
} from "../../../workspace/workspace.service.js";
import type { WorkspaceAuthUser } from "../../../workspace/workspace.types.js";

/**
 * Builds the minimal authenticated user shape needed by read-only legacy calls.
 *
 * @param userId - Current authenticated user id.
 * @returns Workspace auth shape with unused display fields blanked.
 */
function toReadOnlyWorkspaceAuthUser(userId: string): WorkspaceAuthUser {
  return {
    avatarColor: "",
    email: "",
    id: userId,
    initials: "",
    name: "",
  };
}

/** Lists GraphQL documents visible to a user. */
export async function listGraphqlDocuments(
  userId: string,
  _workspaceId?: string,
): Promise<GraphqlDocument[]> {
  return listLegacyDocuments(toReadOnlyWorkspaceAuthUser(userId));
}

/** Returns one GraphQL document if the user may access it. */
export async function getGraphqlDocumentById(
  documentId: string,
  userId: string,
): Promise<GraphqlDocument> {
  return getLegacyDocument(documentId, toReadOnlyWorkspaceAuthUser(userId));
}

/** Creates a GraphQL document in an accessible workspace. */
export async function createGraphqlDocument(
  input: GraphqlCreateDocumentInput,
  authUser: GraphqlAuthUser,
): Promise<GraphqlDocument> {
  const createdItem = await createDocument(
    {
      content: input.content,
      name: input.name ?? input.title,
      parentId: input.parentId ?? null,
    },
    authUser,
  );
  return getLegacyDocument(createdItem.id, authUser);
}

/** Updates GraphQL document content or metadata with optimistic revision checks. */
export async function updateGraphqlDocument(
  documentId: string,
  input: GraphqlUpdateDocumentInput,
  authUser: GraphqlAuthUser,
): Promise<GraphqlDocument> {
  return updateLegacyDocument(documentId, input, authUser);
}

/** Invites a collaborator to a GraphQL document. */
export async function inviteGraphqlDocumentCollaborator(
  documentId: string,
  input: GraphqlInviteDocumentCollaboratorInput,
  authUser: GraphqlAuthUser,
): Promise<GraphqlDocument> {
  return inviteLegacyDocumentCollaborator(documentId, input.email, input.role, authUser);
}

/** Deletes a GraphQL document owned by the current user. */
export async function deleteGraphqlDocument(
  documentId: string,
  authUser: GraphqlAuthUser,
): Promise<boolean> {
  await deleteLegacyDocument(documentId, authUser);
  return true;
}
