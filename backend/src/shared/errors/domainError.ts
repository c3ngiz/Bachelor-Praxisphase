/** Machine-readable error codes used by shared backend services. */
export type DomainErrorCode =
  | "BAD_REQUEST"
  | "CONFLICT"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "UNAUTHENTICATED"
  | "VALIDATION_FAILED";

/** Shared service error converted by REST and GraphQL adapters. */
export class DomainError extends Error {
  /**
   * Creates a domain error with HTTP-compatible metadata.
   *
   * @param statusCode - HTTP status code that best represents the failure.
   * @param code - Stable machine-readable error code.
   * @param message - Human-readable message safe for API clients.
   * @param data - Optional structured response details.
   */
  constructor(
    public readonly statusCode: number,
    public readonly code: DomainErrorCode,
    message: string,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = "DomainError";
  }
}
