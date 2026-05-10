import { GraphQLError, type GraphQLFormattedError } from "graphql";
import { ZodError } from "zod";
import { StatusCodes } from "http-status-codes";
import { DomainError } from "../../../shared/errors/domainError.js";

/** Domain error used only by the GraphQL backend. */
export class GraphqlBackendError extends Error {
  /** Creates a GraphQL backend error with status metadata. */
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = "GraphqlBackendError";
  }
}

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

/** Formats errors thrown by GraphQL backend services for Apollo responses. */
export function formatGraphqlBackendError(
  formattedError: GraphQLFormattedError,
  error: unknown,
): GraphQLFormattedError {
  const originalError =
    typeof error === "object" && error !== null && "originalError" in error
      ? (error as { originalError?: unknown }).originalError
      : error;

  if (originalError instanceof ZodError) {
    return {
      message: "Validation failed.",
      extensions: {
        code: "BAD_USER_INPUT",
        statusCode: StatusCodes.BAD_REQUEST,
        issues: originalError.flatten(),
      },
    };
  }

  if (originalError instanceof GraphqlBackendError) {
    return {
      message: originalError.message,
      extensions: {
        code: codeForStatus(originalError.statusCode),
        statusCode: originalError.statusCode,
        ...(originalError.data && typeof originalError.data === "object" ? originalError.data : {}),
      },
    };
  }

  if (originalError instanceof DomainError) {
    return {
      message: originalError.message,
      extensions: {
        code: codeForStatus(originalError.statusCode),
        statusCode: originalError.statusCode,
        ...(originalError.data && typeof originalError.data === "object" ? originalError.data : {}),
      },
    };
  }

  if (error instanceof GraphQLError) {
    return formattedError;
  }

  console.error(error);

  return {
    message: "Internal server error.",
    extensions: {
      code: "INTERNAL_SERVER_ERROR",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    },
  };
}
