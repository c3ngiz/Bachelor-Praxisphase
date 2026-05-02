/** HTTP-aware error used only by the REST backend. */
export class HttpError extends Error {
  /** Creates an error with an HTTP status code and optional response data. */
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}
