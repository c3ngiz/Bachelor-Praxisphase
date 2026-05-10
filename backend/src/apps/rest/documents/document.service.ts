import type { RestAuthUser } from "../auth/auth.dto.js";
import type {
  RestCreateDocumentInput,
  RestDocument,
  RestInviteDocumentCollaboratorInput,
  RestUpdateDocumentInput,
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

/** Lists REST documents visible to a user. */
export async function listRestDocuments(
  userId: string,
  _workspaceId?: string,
): Promise<RestDocument[]> {
  return listLegacyDocuments(toReadOnlyWorkspaceAuthUser(userId));
}

/** Returns one REST document if the user may access it. */
export async function getRestDocumentById(
  documentId: string,
  userId: string,
): Promise<RestDocument> {
  return getLegacyDocument(documentId, toReadOnlyWorkspaceAuthUser(userId));
}

/** Creates a REST document in an accessible workspace. */
export async function createRestDocument(
  input: RestCreateDocumentInput,
  authUser: RestAuthUser,
): Promise<RestDocument> {
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

/** Updates REST document content or metadata with optimistic revision checks. */
export async function updateRestDocument(
  documentId: string,
  input: RestUpdateDocumentInput,
  authUser: RestAuthUser,
): Promise<RestDocument> {
  return updateLegacyDocument(documentId, input, authUser);
}

/** Invites a collaborator to a REST document. */
export async function inviteRestDocumentCollaborator(
  documentId: string,
  input: RestInviteDocumentCollaboratorInput,
  authUser: RestAuthUser,
): Promise<RestDocument> {
  return inviteLegacyDocumentCollaborator(documentId, input.email, input.role, authUser);
}

/** Deletes a REST document owned by the current user. */
export async function deleteRestDocument(
  documentId: string,
  authUser: RestAuthUser,
): Promise<void> {
  await deleteLegacyDocument(documentId, authUser);
}
