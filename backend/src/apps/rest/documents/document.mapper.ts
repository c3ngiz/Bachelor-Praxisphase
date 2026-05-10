import { Prisma } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { HttpError } from "../common/errors/httpError.js";

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
