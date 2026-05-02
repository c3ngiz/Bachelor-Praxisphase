import { GraphQLError, type GraphQLFormattedError } from "graphql";
import { ZodError } from "zod";
import { StatusCodes } from "http-status-codes";
import { ApiError } from "../../../utils/apiError.js";

function codeForStatus(statusCode: number): string {
  if (statusCode === StatusCodes.UNAUTHORIZED) {
    return "UNAUTHENTICATED";
  }

  if (statusCode === StatusCodes.FORBIDDEN) {
    return "FORBIDDEN";
  }

  if (statusCode === StatusCodes.NOT_FOUND) {
    return "NOT_FOUND";
  }

  if (statusCode === StatusCodes.CONFLICT) {
    return "CONFLICT";
  }

  if (statusCode >= 400 && statusCode < 500) {
    return "BAD_USER_INPUT";
  }

  return "INTERNAL_SERVER_ERROR";
}

export function toGraphqlError(error: unknown): GraphQLError {
  if (error instanceof GraphQLError) {
    return error;
  }

  if (error instanceof ZodError) {
    return new GraphQLError("Validation failed.", {
      extensions: {
        code: "BAD_USER_INPUT",
        statusCode: StatusCodes.BAD_REQUEST,
        issues: error.flatten(),
      },
    });
  }

  if (error instanceof ApiError) {
    return new GraphQLError(error.message, {
      extensions: {
        code: codeForStatus(error.statusCode),
        statusCode: error.statusCode,
        ...(error.data && typeof error.data === "object" ? error.data : {}),
      },
    });
  }

  console.error(error);

  return new GraphQLError("Internal server error.", {
    extensions: {
      code: "INTERNAL_SERVER_ERROR",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    },
  });
}

export function formatGraphqlError(error: GraphQLError): GraphQLFormattedError {
  const originalError = error.originalError;
  const mappedError = originalError ? toGraphqlError(originalError) : error;

  return {
    message: mappedError.message,
    locations: error.locations,
    path: error.path,
    extensions: mappedError.extensions,
  };
}
