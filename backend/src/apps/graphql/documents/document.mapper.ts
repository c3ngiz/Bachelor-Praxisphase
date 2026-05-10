import { Prisma } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { GraphqlBackendError } from "../common/errors.js";

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
