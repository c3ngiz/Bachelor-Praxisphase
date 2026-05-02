import { Prisma } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { GraphqlBackendError } from "../common/errors.js";
import type { GraphqlAuthUser } from "../auth/auth.dto.js";
import type { GraphqlDocument, GraphqlDocumentCollaborator } from "./document.dto.js";

export type GraphqlDocumentRecord = {
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

/** Converts GraphQL JSON input into a Prisma JSON input value. */
export function toGraphqlPrismaJsonValue(value: unknown): Prisma.InputJsonValue | null {
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
        return value.map((item) => toGraphqlPrismaJsonValue(item)) as Prisma.InputJsonArray;
      }

      if (!isPlainObject(value)) {
        throw new GraphqlBackendError(StatusCodes.BAD_REQUEST, "Document content must be valid JSON.");
      }

      const result: Record<string, Prisma.InputJsonValue | null> = {};

      for (const [key, item] of Object.entries(value)) {
        result[key] = toGraphqlPrismaJsonValue(item);
      }

      return result as Prisma.InputJsonObject;
    }
    default:
      throw new GraphqlBackendError(StatusCodes.BAD_REQUEST, "Document content must be valid JSON.");
  }
}

/** Converts GraphQL JSON input into a non-null Prisma JSON value. */
export function toGraphqlPrismaNonNullJsonValue(value: unknown): Prisma.InputJsonValue {
  const parsedValue = toGraphqlPrismaJsonValue(value);

  if (parsedValue === null) {
    throw new GraphqlBackendError(StatusCodes.BAD_REQUEST, "Document content must be valid JSON.");
  }

  return parsedValue;
}

/** Reads collaborators from a document JSON field. */
export function getGraphqlDocumentCollaborators(value: unknown): GraphqlDocumentCollaborator[] {
  return Array.isArray(value) ? (value as GraphqlDocumentCollaborator[]) : [];
}

/** Ensures the owner appears once in the GraphQL collaborator list. */
export function normalizeGraphqlCollaborators(
  collaborators: GraphqlDocumentCollaborator[],
  authUser: Pick<GraphqlAuthUser, "id" | "name" | "initials" | "avatarColor">,
): GraphqlDocumentCollaborator[] {
  const ownerEntry: GraphqlDocumentCollaborator = {
    id: authUser.id,
    name: authUser.name,
    initials: authUser.initials,
    color: authUser.avatarColor,
    role: "owner",
  };
  const deduped = new Map<string, GraphqlDocumentCollaborator>();
  deduped.set(ownerEntry.id, ownerEntry);

  for (const collaborator of collaborators) {
    deduped.set(collaborator.id, collaborator.id === authUser.id ? ownerEntry : collaborator);
  }

  return Array.from(deduped.values());
}

/** Maps a document database record into the GraphQL document shape. */
export function toGraphqlDocument(document: GraphqlDocumentRecord): GraphqlDocument {
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
    collaborators: getGraphqlDocumentCollaborators(document.collaborators),
    lastEditedById: document.lastEditedById,
    lastEditedByName: document.lastEditedByName,
    lastEditedAt: document.lastEditedAt.toISOString(),
  };
}
