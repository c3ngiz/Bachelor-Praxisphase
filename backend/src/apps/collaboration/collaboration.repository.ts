import { Prisma } from "@prisma/client";
import { prisma } from "../../shared/database/prisma.js";
import { toRestPrismaNonNullJsonValue } from "../rest/documents/document.mapper.js";

export function findCollaborationState(documentId: string) {
  return prisma.documentCollaborationState.findUnique({
    where: { documentId },
  });
}

export function upsertCollaborationState(documentId: string, yjsState: Uint8Array) {
  return prisma.documentCollaborationState.upsert({
    where: { documentId },
    create: {
      documentId,
      yjsState: Buffer.from(yjsState),
    },
    update: {
      yjsState: Buffer.from(yjsState),
    },
  });
}

export function updateDocumentCollaborationSnapshot(input: {
  documentId: string;
  content: unknown;
  editorId: string;
  editorName: string;
}) {
  return prisma.document.update({
    where: { id: input.documentId },
    data: {
      content:
        input.content === null
          ? Prisma.JsonNull
          : toRestPrismaNonNullJsonValue(input.content),
      revision: { increment: 1 },
      lastEditedById: input.editorId,
      lastEditedByName: input.editorName,
      lastEditedAt: new Date(),
    },
  });
}
