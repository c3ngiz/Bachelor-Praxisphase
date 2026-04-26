import { StatusCodes } from 'http-status-codes';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { ApiError } from '../../utils/apiError.js';
import type { AuthUser } from '../auth/auth.types.js';
import { getDefaultWorkspaceId, getWorkspaceMembership } from '../workspaces/workspace.service.js';
import type {
  CreateDocumentInput,
  InviteDocumentCollaboratorInput,
  UpdateDocumentInput,
} from './document.schemas.js';
import type { DocumentCollaborator, DocumentDto } from './document.types.js';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function toPrismaInputJsonValue(value: unknown): Prisma.InputJsonValue | null {
  if (value === null) {
    return null;
  }

  switch (typeof value) {
    case 'string':
    case 'number':
    case 'boolean':
      return value;
    case 'object': {
      if (Array.isArray(value)) {
        return value.map((item) => toPrismaInputJsonValue(item)) as Prisma.InputJsonArray;
      }

      if (!isPlainObject(value)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Document content must be valid JSON.');
      }

      const result: Record<string, Prisma.InputJsonValue | null> = {};

      for (const [key, item] of Object.entries(value)) {
        result[key] = toPrismaInputJsonValue(item);
      }

      return result as Prisma.InputJsonObject;
    }
    default:
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Document content must be valid JSON.');
  }
}

function toPrismaNonNullJsonValue(value: unknown): Prisma.InputJsonValue {
  const parsedValue = toPrismaInputJsonValue(value);

  if (parsedValue === null) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Document content must be valid JSON.');
  }

  return parsedValue;
}

function normalizeCollaborators(
  collaborators: DocumentCollaborator[],
  authUser: AuthUser,
): DocumentCollaborator[] {
  const ownerEntry: DocumentCollaborator = {
    id: authUser.id,
    name: authUser.name,
    initials: authUser.initials,
    color: authUser.avatarColor,
    role: 'owner',
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
  visibility: 'private' | 'shared' | 'workspace';
  workspaceId: string;
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
    workspaceId: document.workspaceId,
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

function getCollaborators(value: unknown): DocumentCollaborator[] {
  return Array.isArray(value) ? (value as DocumentCollaborator[]) : [];
}

async function canAccessDocument(document: {
  ownerId: string;
  workspaceId: string;
  visibility: 'private' | 'shared' | 'workspace';
  collaborators: unknown;
}, userId: string): Promise<boolean> {
  if (document.ownerId === userId) {
    return true;
  }

  const collaborators = getCollaborators(document.collaborators);

  if (collaborators.some((collaborator) => collaborator.id === userId)) {
    return true;
  }

  const membership = await getWorkspaceMembership(document.workspaceId, userId);

  return Boolean(membership && !membership.workspace.isDefault);
}

async function canEditDocument(document: {
  ownerId: string;
  workspaceId: string;
  visibility: 'private' | 'shared' | 'workspace';
  collaborators: unknown;
}, authUser: AuthUser): Promise<boolean> {
  if (document.ownerId === authUser.id) {
    return true;
  }

  const collaborators = getCollaborators(document.collaborators);
  const currentCollaborator = collaborators.find(
    (collaborator) => collaborator.id === authUser.id,
  );

  if (currentCollaborator?.role === 'owner' || currentCollaborator?.role === 'editor') {
    return true;
  }

  const membership = await getWorkspaceMembership(document.workspaceId, authUser.id);

  return (
    !membership?.workspace.isDefault &&
    (membership?.role === 'owner' || membership?.role === 'editor')
  );
}

export async function listDocuments(userId: string, workspaceId?: string): Promise<DocumentDto[]> {
  if (workspaceId) {
    const membership = await getWorkspaceMembership(workspaceId, userId);

    if (!membership) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have access to this workspace.');
    }
  }

  const documents = await prisma.document.findMany({
    where: workspaceId ? { workspaceId } : undefined,
    orderBy: { updatedAt: 'desc' },
  });

  const visibleDocuments: DocumentDto[] = [];

  for (const document of documents) {
    if (await canAccessDocument(document, userId)) {
      visibleDocuments.push(toDocumentDto(document));
    }
  }

  return visibleDocuments;
}

export async function getDocumentById(documentId: string, userId: string): Promise<DocumentDto> {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Document not found.');
  }

  if (!(await canAccessDocument(document, userId))) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have access to this document.');
  }

  return toDocumentDto(document);
}

export async function createDocument(
  input: CreateDocumentInput,
  authUser: AuthUser,
): Promise<DocumentDto> {
  const collaborators = normalizeCollaborators(input.collaborators, authUser);
  const now = new Date();
  const workspaceId = input.workspaceId ?? (await getDefaultWorkspaceId(authUser.id));
  const membership = await getWorkspaceMembership(workspaceId, authUser.id);

  if (!membership) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have access to this workspace.');
  }

  if (membership.role === 'viewer') {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have permission to create documents.');
  }

  const visibility =
    !membership.workspace.isDefault && input.visibility === 'private'
      ? 'workspace'
      : input.visibility;

  const document = await prisma.document.create({
    data: {
      title: input.title,
      content: input.content === null ? Prisma.JsonNull : toPrismaNonNullJsonValue(input.content),
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
    throw new ApiError(StatusCodes.NOT_FOUND, 'Document not found.');
  }

  const existingCollaborators = getCollaborators(existingDocument.collaborators);

  if (!(await canEditDocument(existingDocument, authUser))) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have permission to edit this document.');
  }

  const collaborators = input.collaborators
    ? normalizeCollaborators(input.collaborators, authUser)
    : existingCollaborators;
  const membership = await getWorkspaceMembership(existingDocument.workspaceId, authUser.id);
  const visibility =
    input.visibility === 'private' && membership && !membership.workspace.isDefault
      ? 'workspace'
      : input.visibility;

  const updatedDocument = await prisma.document.update({
    where: { id: documentId },
    data: {
      title: input.title,
      content:
        input.content === undefined
          ? undefined
          : input.content === null
            ? Prisma.JsonNull
            : toPrismaNonNullJsonValue(input.content),
      visibility,
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

export async function inviteDocumentCollaborator(
  documentId: string,
  input: InviteDocumentCollaboratorInput,
  authUser: AuthUser,
): Promise<DocumentDto> {
  const existingDocument = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!existingDocument) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Document not found.');
  }

  if (!(await canEditDocument(existingDocument, authUser))) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have permission to share this document.');
  }

  const invitedUser = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
    select: {
      id: true,
      name: true,
      initials: true,
      avatarColor: true,
    },
  });

  if (!invitedUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'No registered user exists for this email.');
  }

  const existingCollaborators = getCollaborators(existingDocument.collaborators);
  const nextCollaborators = normalizeCollaborators(
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
      email: '',
      name: existingDocument.ownerName,
      initials:
        existingCollaborators.find((collaborator) => collaborator.id === existingDocument.ownerId)
          ?.initials ?? 'O',
      avatarColor:
        existingCollaborators.find((collaborator) => collaborator.id === existingDocument.ownerId)
          ?.color ?? 'bg-violet-500',
      createdAt: '',
      updatedAt: '',
    },
  );

  const updatedDocument = await prisma.document.update({
    where: { id: documentId },
    data: {
      collaborators: nextCollaborators,
      visibility: existingDocument.visibility === 'private' ? 'shared' : existingDocument.visibility,
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
    throw new ApiError(StatusCodes.NOT_FOUND, 'Document not found.');
  }

  if (existingDocument.ownerId !== authUser.id) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Only the owner can delete this document.');
  }

  await prisma.document.delete({
    where: { id: documentId },
  });
}
