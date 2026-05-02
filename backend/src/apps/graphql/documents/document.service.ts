import { Prisma } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import type { GraphqlAuthUser } from "../auth/auth.dto.js";
import { GraphqlBackendError } from "../common/errors.js";
import {
  getGraphqlDefaultWorkspaceId,
  getGraphqlWorkspaceMembership,
} from "../workspaces/workspace.service.js";
import type {
  GraphqlCreateDocumentInput,
  GraphqlDocument,
  GraphqlDocumentCollaborator,
  GraphqlInviteDocumentCollaboratorInput,
  GraphqlUpdateDocumentInput,
} from "./document.dto.js";
import {
  getGraphqlDocumentCollaborators,
  normalizeGraphqlCollaborators,
  toGraphqlDocument,
  toGraphqlPrismaNonNullJsonValue,
} from "./document.mapper.js";
import { canGraphqlAccessDocument, canGraphqlEditDocument } from "./document.permissions.js";
import {
  createGraphqlDocumentRecord,
  deleteGraphqlDocumentRecord,
  findGraphqlDocumentById,
  findGraphqlDocumentInvitee,
  findGraphqlDocuments,
  updateGraphqlDocumentByRevision,
  updateGraphqlDocumentSharing,
} from "./document.repository.js";

function createGraphqlConflictError(
  expectedRevision: number,
  currentDocument: GraphqlDocument,
): GraphqlBackendError {
  return new GraphqlBackendError(StatusCodes.CONFLICT, "Document revision conflict.", {
    conflict: {
      expectedRevision,
      actualRevision: currentDocument.revision,
    },
    document: currentDocument,
  });
}

/** Lists GraphQL documents visible to a user. */
export async function listGraphqlDocuments(
  userId: string,
  workspaceId?: string,
): Promise<GraphqlDocument[]> {
  if (workspaceId) {
    const membership = await getGraphqlWorkspaceMembership(workspaceId, userId);

    if (!membership) {
      throw new GraphqlBackendError(StatusCodes.FORBIDDEN, "You do not have access to this workspace.");
    }
  }

  const documents = await findGraphqlDocuments(workspaceId);
  const visibleDocuments: GraphqlDocument[] = [];

  for (const document of documents) {
    if (await canGraphqlAccessDocument(document, userId)) {
      visibleDocuments.push(toGraphqlDocument(document));
    }
  }

  return visibleDocuments;
}

/** Returns one GraphQL document if the user may access it. */
export async function getGraphqlDocumentById(
  documentId: string,
  userId: string,
): Promise<GraphqlDocument> {
  const document = await findGraphqlDocumentById(documentId);

  if (!document) {
    throw new GraphqlBackendError(StatusCodes.NOT_FOUND, "Document not found.");
  }

  if (!(await canGraphqlAccessDocument(document, userId))) {
    throw new GraphqlBackendError(StatusCodes.FORBIDDEN, "You do not have access to this document.");
  }

  return toGraphqlDocument(document);
}

/** Creates a GraphQL document in an accessible workspace. */
export async function createGraphqlDocument(
  input: GraphqlCreateDocumentInput,
  authUser: GraphqlAuthUser,
): Promise<GraphqlDocument> {
  const collaborators = normalizeGraphqlCollaborators(input.collaborators, authUser);
  const now = new Date();
  const workspaceId = input.workspaceId ?? (await getGraphqlDefaultWorkspaceId(authUser.id));
  const membership = await getGraphqlWorkspaceMembership(workspaceId, authUser.id);

  if (!membership) {
    throw new GraphqlBackendError(StatusCodes.FORBIDDEN, "You do not have access to this workspace.");
  }

  if (membership.role === "viewer") {
    throw new GraphqlBackendError(StatusCodes.FORBIDDEN, "You do not have permission to create documents.");
  }

  const visibility =
    !membership.workspace.isDefault && input.visibility === "private"
      ? "workspace"
      : input.visibility;
  const document = await createGraphqlDocumentRecord({
    title: input.title,
    content:
      input.content === null ? Prisma.JsonNull : toGraphqlPrismaNonNullJsonValue(input.content),
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

  return toGraphqlDocument(document);
}

/** Updates GraphQL document content or metadata with optimistic revision checks. */
export async function updateGraphqlDocument(
  documentId: string,
  input: GraphqlUpdateDocumentInput,
  authUser: GraphqlAuthUser,
): Promise<GraphqlDocument> {
  const existingDocument = await findGraphqlDocumentById(documentId);

  if (!existingDocument) {
    throw new GraphqlBackendError(StatusCodes.NOT_FOUND, "Document not found.");
  }

  if (!(await canGraphqlEditDocument(existingDocument, authUser))) {
    throw new GraphqlBackendError(StatusCodes.FORBIDDEN, "You do not have permission to edit this document.");
  }

  if (input.expectedRevision !== existingDocument.revision) {
    throw createGraphqlConflictError(input.expectedRevision, toGraphqlDocument(existingDocument));
  }

  const existingCollaborators = getGraphqlDocumentCollaborators(existingDocument.collaborators);
  const collaborators = input.collaborators
    ? normalizeGraphqlCollaborators(input.collaborators, authUser)
    : existingCollaborators;
  const membership = await getGraphqlWorkspaceMembership(existingDocument.workspaceId, authUser.id);
  const visibility =
    input.visibility === "private" && membership && !membership.workspace.isDefault
      ? "workspace"
      : input.visibility;
  const updateResult = await updateGraphqlDocumentByRevision({
    documentId,
    expectedRevision: input.expectedRevision,
    data: {
      title: input.title,
      content:
        input.content === undefined
          ? undefined
          : input.content === null
            ? Prisma.JsonNull
            : toGraphqlPrismaNonNullJsonValue(input.content),
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
  const currentDocument = await findGraphqlDocumentById(documentId);

  if (!currentDocument) {
    throw new GraphqlBackendError(StatusCodes.NOT_FOUND, "Document not found.");
  }

  if (updateResult.count === 0) {
    throw createGraphqlConflictError(input.expectedRevision, toGraphqlDocument(currentDocument));
  }

  return toGraphqlDocument(currentDocument);
}

/** Invites a collaborator to a GraphQL document. */
export async function inviteGraphqlDocumentCollaborator(
  documentId: string,
  input: GraphqlInviteDocumentCollaboratorInput,
  authUser: GraphqlAuthUser,
): Promise<GraphqlDocument> {
  const existingDocument = await findGraphqlDocumentById(documentId);

  if (!existingDocument) {
    throw new GraphqlBackendError(StatusCodes.NOT_FOUND, "Document not found.");
  }

  if (!(await canGraphqlEditDocument(existingDocument, authUser))) {
    throw new GraphqlBackendError(StatusCodes.FORBIDDEN, "You do not have permission to share this document.");
  }

  const invitedUser = await findGraphqlDocumentInvitee(input.email);

  if (!invitedUser) {
    throw new GraphqlBackendError(StatusCodes.NOT_FOUND, "No registered user exists for this email.");
  }

  const existingCollaborators = getGraphqlDocumentCollaborators(existingDocument.collaborators);
  const nextCollaborators = normalizeGraphqlCollaborators(
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
  const updatedDocument = await updateGraphqlDocumentSharing({
    documentId,
    collaborators: nextCollaborators as GraphqlDocumentCollaborator[],
    visibility: existingDocument.visibility === "private" ? "shared" : existingDocument.visibility,
    editorId: authUser.id,
    editorName: authUser.name,
  });

  return toGraphqlDocument(updatedDocument);
}

/** Deletes a GraphQL document owned by the current user. */
export async function deleteGraphqlDocument(
  documentId: string,
  authUser: GraphqlAuthUser,
): Promise<boolean> {
  const existingDocument = await findGraphqlDocumentById(documentId);

  if (!existingDocument) {
    throw new GraphqlBackendError(StatusCodes.NOT_FOUND, "Document not found.");
  }

  if (existingDocument.ownerId !== authUser.id) {
    throw new GraphqlBackendError(StatusCodes.FORBIDDEN, "Only the owner can delete this document.");
  }

  await deleteGraphqlDocumentRecord(documentId);
  return true;
}
