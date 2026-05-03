import { Prisma } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { HttpError } from "../common/errors/httpError.js";
import type { RestAuthUser } from "../auth/auth.dto.js";
import type { RestDocument, RestDocumentCollaborator, RestDocumentRole } from "./document.dto.js";

export type RestDocumentRecord = {
  id: string;
  title: string;
  content: unknown;
  revision: number;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  lastOpenedAt: Date | null;
  visibility: "private" | "shared" | "workspace";
  workspaceId: string;
  ownerId: string;
  ownerName: string;
  collaborators: unknown;
  lastEditedById: string;
  lastEditedByName: string;
  lastEditedAt: Date;
};

/** Checks whether an unknown value is a JSON object. */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === "[object Object]";
}

/** Converts user-supplied JSON into a Prisma JSON input value. */
export function toRestPrismaJsonValue(value: unknown): Prisma.InputJsonValue | null {
  if (value === null) {
    return null;
  }

  switch (typeof value) {
    case "string":
    case "number":
    case "boolean":
      return value;
    case "object": {
      if (Array.isArray(value)) {
        return value.map((item) => toRestPrismaJsonValue(item)) as Prisma.InputJsonArray;
      }

      if (!isPlainObject(value)) {
        throw new HttpError(StatusCodes.BAD_REQUEST, "Document content must be valid JSON.");
      }

      const result: Record<string, Prisma.InputJsonValue | null> = {};

      for (const [key, item] of Object.entries(value)) {
        result[key] = toRestPrismaJsonValue(item);
      }

      return result as Prisma.InputJsonObject;
    }
    default:
      throw new HttpError(StatusCodes.BAD_REQUEST, "Document content must be valid JSON.");
  }
}

/** Converts user-supplied JSON into a non-null Prisma JSON value. */
export function toRestPrismaNonNullJsonValue(value: unknown): Prisma.InputJsonValue {
  const parsedValue = toRestPrismaJsonValue(value);

  if (parsedValue === null) {
    throw new HttpError(StatusCodes.BAD_REQUEST, "Document content must be valid JSON.");
  }

  return parsedValue;
}

/** Reads collaborators from a document JSON field. */
export function getRestDocumentCollaborators(value: unknown): RestDocumentCollaborator[] {
  return Array.isArray(value) ? (value as RestDocumentCollaborator[]) : [];
}

/** Ensures the owner appears once in the REST collaborator list. */
export function normalizeRestCollaborators(
  collaborators: RestDocumentCollaborator[],
  authUser: Pick<RestAuthUser, "id" | "name" | "initials" | "avatarColor">,
): RestDocumentCollaborator[] {
  const ownerEntry: RestDocumentCollaborator = {
    id: authUser.id,
    name: authUser.name,
    initials: authUser.initials,
    color: authUser.avatarColor,
    role: "owner",
  };
  const deduped = new Map<string, RestDocumentCollaborator>();
  deduped.set(ownerEntry.id, ownerEntry);

  for (const collaborator of collaborators) {
    deduped.set(collaborator.id, collaborator.id === authUser.id ? ownerEntry : collaborator);
  }

  return Array.from(deduped.values());
}

export type RestDocumentCapabilities = {
  currentUserRole: RestDocumentRole | null;
  canEdit: boolean;
  canShare: boolean;
  canDelete: boolean;
};

const defaultRestDocumentCapabilities: RestDocumentCapabilities = {
  currentUserRole: null,
  canEdit: false,
  canShare: false,
  canDelete: false,
};

/** Maps a document database record into the REST document response shape. */
export function toRestDocument(
  document: RestDocumentRecord,
  capabilities: RestDocumentCapabilities = defaultRestDocumentCapabilities,
): RestDocument {
  return {
    id: document.id,
    title: document.title,
    content: document.content,
    revision: document.revision,
    author: document.author,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
    lastOpenedAt: document.lastOpenedAt?.toISOString(),
    visibility: document.visibility,
    workspaceId: document.workspaceId,
    ownerId: document.ownerId,
    ownerName: document.ownerName,
    collaborators: getRestDocumentCollaborators(document.collaborators),
    currentUserRole: capabilities.currentUserRole,
    canEdit: capabilities.canEdit,
    canShare: capabilities.canShare,
    canDelete: capabilities.canDelete,
    lastEditedById: document.lastEditedById,
    lastEditedByName: document.lastEditedByName,
    lastEditedAt: document.lastEditedAt.toISOString(),
  };
}
