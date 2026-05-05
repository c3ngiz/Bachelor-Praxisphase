/** Standard API response shape used by service stubs. */
export interface ApiResponse<T> {
  /** Response payload. */
  data: T;
  /** Indicates whether the request completed successfully. */
  success: boolean;
  /** Optional human-readable response message. */
  message?: string;
}

/** Standard API error shape for future integrations. */
export interface ApiError {
  /** Machine-readable error code. */
  code: string;
  /** Human-readable error message. */
  message: string;
}
