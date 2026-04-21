import { StatusCodes } from "http-status-codes";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import type { AuthUser } from "../auth/auth.types.js";
import type { CreateDocumentInput, UpdateDocumentInput } from "./document.schemas.js";
import type { DocumentCollaborator, DocumentDto } from "./document.types.js";

function normalizeCollaborators(
  collaborators: DocumentCollaborator[],
  authUser: AuthUser,
): DocumentCollaborator[] {
  const ownerEntry: DocumentCollaborator = {
    id: authUser.id,
    name: authUser.name,
    initials: authUser.initials,
    color: authUser.avatarColor,
    role: "owner",
  };

  const deduped = new Map<string, DocumentCollaborator>();
  deduped.set(ownerEntry.id, ownerEntry);

  for (const collaborator of collaborators) {
    if (collaborator.id === authUser.id) {
      deduped.set(authUser.id, ownerEntry);
      continue;
    }

    deduped.set(collaborator.id, collaborator);
  }

  return Array.from(deduped.values());
}

function toDocumentDto(document: {
  id: string;
  title: string;
  content: unknown;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  lastOpenedAt: Date | null;
  visibility: "private" | "shared" | "workspace";
  ownerId: string;
  ownerName: string;
  collaborators: unknown;
  lastEditedById: string;
  lastEditedByName: string;
  lastEditedAt: Date;
}): DocumentDto {
  return {
    id: document.id,
    title: document.title,
    content: document.content,
    author: document.author,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
    lastOpenedAt: document.lastOpenedAt?.toISOString(),
    visibility: document.visibility,
    ownerId: document.ownerId,
    ownerName: document.ownerName,
    collaborators: Array.isArray(document.collaborators)
      ? (document.collaborators as DocumentCollaborator[])
      : [],
    lastEditedById: document.lastEditedById,
    lastEditedByName: document.lastEditedByName,
    lastEditedAt: document.lastEditedAt.toISOString(),
  };
}

export async function listDocuments(userId: string): Promise<DocumentDto[]> {
  const documents = await prisma.document.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return documents
    .filter((document) => {
      const collaborators = Array.isArray(document.collaborators)
        ? (document.collaborators as DocumentCollaborator[])
        : [];

      return document.ownerId === userId || collaborators.some((collaborator) => collaborator.id === userId);
    })
    .map(toDocumentDto);
}

export async function getDocumentById(documentId: string, userId: string): Promise<DocumentDto> {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Document not found.");
  }

  const collaborators = Array.isArray(document.collaborators)
    ? (document.collaborators as DocumentCollaborator[])
    : [];

  const canAccess = document.ownerId === userId || collaborators.some((collaborator) => collaborator.id === userId);

  if (!canAccess) {
    throw new ApiError(StatusCodes.FORBIDDEN, "You do not have access to this document.");
  }

  return toDocumentDto(document);
}

export async function createDocument(input: CreateDocumentInput, authUser: AuthUser): Promise<DocumentDto> {
  const collaborators = normalizeCollaborators(input.collaborators, authUser);
  const now = new Date();

  const document = await prisma.document.create({
    data: {
      title: input.title,
      content: input.content,
      author: authUser.name,
      visibility: input.visibility,
      ownerId: authUser.id,
      ownerName: authUser.name,
      collaborators,
      lastEditedById: authUser.id,
      lastEditedByName: authUser.name,
      lastEditedAt: now,
      lastOpenedAt: now,
    },
  });

  return toDocumentDto(document);
}

export async function updateDocument(
  documentId: string,
  input: UpdateDocumentInput,
  authUser: AuthUser,
): Promise<DocumentDto> {
  const existingDocument = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!existingDocument) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Document not found.");
  }

  const existingCollaborators = Array.isArray(existingDocument.collaborators)
    ? (existingDocument.collaborators as DocumentCollaborator[])
    : [];

  const currentCollaborator = existingCollaborators.find((collaborator) => collaborator.id === authUser.id);
  const canEdit =
    existingDocument.ownerId === authUser.id ||
    currentCollaborator?.role === "owner" ||
    currentCollaborator?.role === "editor";

  if (!canEdit) {
    throw new ApiError(StatusCodes.FORBIDDEN, "You do not have permission to edit this document.");
  }

  const collaborators = input.collaborators
    ? normalizeCollaborators(input.collaborators, authUser)
    : existingCollaborators;

  const updatedDocument = await prisma.document.update({
    where: { id: documentId },
    data: {
      title: input.title,
      content: input.content,
      visibility: input.visibility,
      collaborators,
      lastOpenedAt:
        input.lastOpenedAt === undefined
          ? undefined
          : input.lastOpenedAt === null
            ? null
            : new Date(input.lastOpenedAt),
      lastEditedById: authUser.id,
      lastEditedByName: authUser.name,
      lastEditedAt: new Date(),
    },
  });

  return toDocumentDto(updatedDocument);
}

export async function deleteDocument(documentId: string, authUser: AuthUser): Promise<void> {
  const existingDocument = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!existingDocument) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Document not found.");
  }

  if (existingDocument.ownerId !== authUser.id) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Only the owner can delete this document.");
  }

  await prisma.document.delete({
    where: { id: documentId },
  });
}
