import { Prisma } from "@prisma/client";
import { prisma } from "../../../shared/database/prisma.js";
import type { RestDocumentCollaborator, RestDocumentVisibility } from "./document.dto.js";

/** Lists REST document records, optionally scoped to a workspace. */
export function findRestDocuments(workspaceId?: string) {
  return prisma.document.findMany({
    where: workspaceId ? { workspaceId } : undefined,
    orderBy: { updatedAt: "desc" },
  });
}

/** Finds a REST document by id. */
export function findRestDocumentById(documentId: string) {
  return prisma.document.findUnique({
    where: { id: documentId },
  });
}

/** Creates a REST document record. */
export function createRestDocumentRecord(input: {
  title: string;
  content: Prisma.InputJsonValue | typeof Prisma.JsonNull;
  author: string;
  visibility: RestDocumentVisibility;
  workspaceId: string;
  ownerId: string;
  ownerName: string;
  collaborators: RestDocumentCollaborator[];
  lastEditedById: string;
  lastEditedByName: string;
  lastEditedAt: Date;
  lastOpenedAt: Date;
}) {
  return prisma.document.create({
    data: input,
  });
}

/** Updates a REST document if its revision still matches the expected revision. */
export function updateRestDocumentByRevision(input: {
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

/** Finds a registered user for REST document collaborator invitations. */
export function findRestDocumentInvitee(email: string) {
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

/** Updates REST document sharing metadata. */
export function updateRestDocumentSharing(input: {
  documentId: string;
  collaborators: RestDocumentCollaborator[];
  visibility: RestDocumentVisibility;
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

/** Deletes a REST document by id. */
export function deleteRestDocumentRecord(documentId: string) {
  return prisma.document.delete({
    where: { id: documentId },
  });
}
