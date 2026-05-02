import { Prisma } from "@prisma/client";
import { prisma } from "../../../shared/database/prisma.js";
import type { GraphqlDocumentCollaborator, GraphqlDocumentVisibility } from "./document.dto.js";

/** Lists GraphQL document records, optionally scoped to a workspace. */
export function findGraphqlDocuments(workspaceId?: string) {
  return prisma.document.findMany({
    where: workspaceId ? { workspaceId } : undefined,
    orderBy: { updatedAt: "desc" },
  });
}

/** Finds a GraphQL document by id. */
export function findGraphqlDocumentById(documentId: string) {
  return prisma.document.findUnique({
    where: { id: documentId },
  });
}

/** Creates a GraphQL document record. */
export function createGraphqlDocumentRecord(input: {
  title: string;
  content: Prisma.InputJsonValue | typeof Prisma.JsonNull;
  author: string;
  visibility: GraphqlDocumentVisibility;
  workspaceId: string;
  ownerId: string;
  ownerName: string;
  collaborators: GraphqlDocumentCollaborator[];
  lastEditedById: string;
  lastEditedByName: string;
  lastEditedAt: Date;
  lastOpenedAt: Date;
}) {
  return prisma.document.create({
    data: input,
  });
}

/** Updates a GraphQL document if its revision still matches the expected revision. */
export function updateGraphqlDocumentByRevision(input: {
  documentId: string;
  expectedRevision: number;
  data: Parameters<typeof prisma.document.updateMany>[0]["data"];
}) {
  return prisma.document.updateMany({
    where: {
      id: input.documentId,
      revision: input.expectedRevision,
    },
    data: input.data,
  });
}

/** Finds a registered user for GraphQL document collaborator invitations. */
export function findGraphqlDocumentInvitee(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      name: true,
      initials: true,
      avatarColor: true,
    },
  });
}

/** Updates GraphQL document sharing metadata. */
export function updateGraphqlDocumentSharing(input: {
  documentId: string;
  collaborators: GraphqlDocumentCollaborator[];
  visibility: GraphqlDocumentVisibility;
  editorId: string;
  editorName: string;
}) {
  return prisma.document.update({
    where: { id: input.documentId },
    data: {
      collaborators: input.collaborators,
      visibility: input.visibility,
      revision: { increment: 1 },
      lastEditedById: input.editorId,
      lastEditedByName: input.editorName,
      lastEditedAt: new Date(),
    },
  });
}

/** Deletes a GraphQL document by id. */
export function deleteGraphqlDocumentRecord(documentId: string) {
  return prisma.document.delete({
    where: { id: documentId },
  });
}
