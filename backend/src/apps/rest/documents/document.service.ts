import { Prisma } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import type { RestAuthUser } from "../auth/auth.dto.js";
import { HttpError } from "../common/errors/httpError.js";
import { getRestDefaultWorkspaceId, getRestWorkspaceMembership } from "../workspaces/workspace.service.js";
import type {
  RestCreateDocumentInput,
  RestDocument,
  RestDocumentCollaborator,
  RestInviteDocumentCollaboratorInput,
  RestUpdateDocumentInput,
} from "./document.dto.js";
import {
  getRestDocumentCollaborators,
  normalizeRestCollaborators,
  toRestDocument,
  toRestPrismaNonNullJsonValue,
} from "./document.mapper.js";
import { canRestAccessDocument, canRestEditDocument } from "./document.permissions.js";
import {
  createRestDocumentRecord,
  deleteRestDocumentRecord,
  findRestDocumentById,
  findRestDocumentInvitee,
  findRestDocuments,
  updateRestDocumentByRevision,
  updateRestDocumentSharing,
} from "./document.repository.js";

function createRestConflictError(expectedRevision: number, currentDocument: RestDocument): HttpError {
  return new HttpError(StatusCodes.CONFLICT, "Document revision conflict.", {
    conflict: {
      expectedRevision,
      actualRevision: currentDocument.revision,
    },
    document: currentDocument,
  });
}

/** Lists REST documents visible to a user. */
export async function listRestDocuments(
  userId: string,
  workspaceId?: string,
): Promise<RestDocument[]> {
  if (workspaceId) {
    const membership = await getRestWorkspaceMembership(workspaceId, userId);

    if (!membership) {
      throw new HttpError(StatusCodes.FORBIDDEN, "You do not have access to this workspace.");
    }
  }

  const documents = await findRestDocuments(workspaceId);
  const visibleDocuments: RestDocument[] = [];

  for (const document of documents) {
    if (await canRestAccessDocument(document, userId)) {
      visibleDocuments.push(toRestDocument(document));
    }
  }

  return visibleDocuments;
}

/** Returns one REST document if the user may access it. */
export async function getRestDocumentById(
  documentId: string,
  userId: string,
): Promise<RestDocument> {
  const document = await findRestDocumentById(documentId);

  if (!document) {
    throw new HttpError(StatusCodes.NOT_FOUND, "Document not found.");
  }

  if (!(await canRestAccessDocument(document, userId))) {
    throw new HttpError(StatusCodes.FORBIDDEN, "You do not have access to this document.");
  }

  return toRestDocument(document);
}

/** Creates a REST document in an accessible workspace. */
export async function createRestDocument(
  input: RestCreateDocumentInput,
  authUser: RestAuthUser,
): Promise<RestDocument> {
  const collaborators = normalizeRestCollaborators(input.collaborators, authUser);
  const now = new Date();
  const workspaceId = input.workspaceId ?? (await getRestDefaultWorkspaceId(authUser.id));
  const membership = await getRestWorkspaceMembership(workspaceId, authUser.id);

  if (!membership) {
    throw new HttpError(StatusCodes.FORBIDDEN, "You do not have access to this workspace.");
  }

  if (membership.role === "viewer") {
    throw new HttpError(StatusCodes.FORBIDDEN, "You do not have permission to create documents.");
  }

  const visibility =
    !membership.workspace.isDefault && input.visibility === "private"
      ? "workspace"
      : input.visibility;
  const document = await createRestDocumentRecord({
    title: input.title,
    content: input.content === null ? Prisma.JsonNull : toRestPrismaNonNullJsonValue(input.content),
    author: authUser.name,
    visibility,
    workspaceId,
    ownerId: authUser.id,
    ownerName: authUser.name,
    collaborators,
    lastEditedById: authUser.id,
    lastEditedByName: authUser.name,
    lastEditedAt: now,
    lastOpenedAt: now,
  });

  return toRestDocument(document);
}

/** Updates REST document content or metadata with optimistic revision checks. */
export async function updateRestDocument(
  documentId: string,
  input: RestUpdateDocumentInput,
  authUser: RestAuthUser,
): Promise<RestDocument> {
  const existingDocument = await findRestDocumentById(documentId);

  if (!existingDocument) {
    throw new HttpError(StatusCodes.NOT_FOUND, "Document not found.");
  }

  if (!(await canRestEditDocument(existingDocument, authUser))) {
    throw new HttpError(StatusCodes.FORBIDDEN, "You do not have permission to edit this document.");
  }

  if (input.expectedRevision !== existingDocument.revision) {
    throw createRestConflictError(input.expectedRevision, toRestDocument(existingDocument));
  }

  const existingCollaborators = getRestDocumentCollaborators(existingDocument.collaborators);
  const collaborators = input.collaborators
    ? normalizeRestCollaborators(input.collaborators, authUser)
    : existingCollaborators;
  const membership = await getRestWorkspaceMembership(existingDocument.workspaceId, authUser.id);
  const visibility =
    input.visibility === "private" && membership && !membership.workspace.isDefault
      ? "workspace"
      : input.visibility;

  const updateResult = await updateRestDocumentByRevision({
    documentId,
    expectedRevision: input.expectedRevision,
    data: {
      title: input.title,
      content:
        input.content === undefined
          ? undefined
          : input.content === null
            ? Prisma.JsonNull
            : toRestPrismaNonNullJsonValue(input.content),
      visibility,
      collaborators,
      lastOpenedAt:
        input.lastOpenedAt === undefined
          ? undefined
          : input.lastOpenedAt === null
            ? null
            : new Date(input.lastOpenedAt),
      revision: { increment: 1 },
      lastEditedById: authUser.id,
      lastEditedByName: authUser.name,
      lastEditedAt: new Date(),
    },
  });
  const currentDocument = await findRestDocumentById(documentId);

  if (!currentDocument) {
    throw new HttpError(StatusCodes.NOT_FOUND, "Document not found.");
  }

  if (updateResult.count === 0) {
    throw createRestConflictError(input.expectedRevision, toRestDocument(currentDocument));
  }

  return toRestDocument(currentDocument);
}

/** Invites a collaborator to a REST document. */
export async function inviteRestDocumentCollaborator(
  documentId: string,
  input: RestInviteDocumentCollaboratorInput,
  authUser: RestAuthUser,
): Promise<RestDocument> {
  const existingDocument = await findRestDocumentById(documentId);

  if (!existingDocument) {
    throw new HttpError(StatusCodes.NOT_FOUND, "Document not found.");
  }

  if (!(await canRestEditDocument(existingDocument, authUser))) {
    throw new HttpError(StatusCodes.FORBIDDEN, "You do not have permission to share this document.");
  }

  const invitedUser = await findRestDocumentInvitee(input.email);

  if (!invitedUser) {
    throw new HttpError(StatusCodes.NOT_FOUND, "No registered user exists for this email.");
  }

  const existingCollaborators = getRestDocumentCollaborators(existingDocument.collaborators);
  const nextCollaborators = normalizeRestCollaborators(
    [
      ...existingCollaborators.filter((collaborator) => collaborator.id !== invitedUser.id),
      {
        id: invitedUser.id,
        name: invitedUser.name,
        initials: invitedUser.initials,
        color: invitedUser.avatarColor,
        role: input.role,
      },
    ],
    {
      id: existingDocument.ownerId,
      name: existingDocument.ownerName,
      initials:
        existingCollaborators.find((collaborator) => collaborator.id === existingDocument.ownerId)
          ?.initials ?? "O",
      avatarColor:
        existingCollaborators.find((collaborator) => collaborator.id === existingDocument.ownerId)
          ?.color ?? "bg-violet-500",
    },
  );
  const updatedDocument = await updateRestDocumentSharing({
    documentId,
    collaborators: nextCollaborators as RestDocumentCollaborator[],
    visibility: existingDocument.visibility === "private" ? "shared" : existingDocument.visibility,
    editorId: authUser.id,
    editorName: authUser.name,
  });

  return toRestDocument(updatedDocument);
}

/** Deletes a REST document owned by the current user. */
export async function deleteRestDocument(
  documentId: string,
  authUser: RestAuthUser,
): Promise<void> {
  const existingDocument = await findRestDocumentById(documentId);

  if (!existingDocument) {
    throw new HttpError(StatusCodes.NOT_FOUND, "Document not found.");
  }

  if (existingDocument.ownerId !== authUser.id) {
    throw new HttpError(StatusCodes.FORBIDDEN, "Only the owner can delete this document.");
  }

  await deleteRestDocumentRecord(documentId);
}
