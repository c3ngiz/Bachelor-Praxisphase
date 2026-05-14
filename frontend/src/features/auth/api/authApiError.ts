import { AxiosError, isAxiosError } from 'axios';

import type { ApiError, AuthFieldErrors } from '../types/auth.types';

type RestErrorResponse = {
  message?: string;
  issues?: {
    fieldErrors?: Record<string, string[]>;
  };
};

type GraphqlErrorResponse = {
  errors?: Array<{
    message?: string;
    extensions?: {
      code?: string;
      statusCode?: number;
      issues?: {
        fieldErrors?: Record<string, string[]>;
      };
    };
  }>;
};

/** Error type used internally once backend failures are normalized. */
export class NormalizedApiError extends Error implements ApiError {
  /** Optional HTTP status code or GraphQL extension status. */
  readonly statusCode?: number;
  /** Optional machine-readable backend error code. */
  readonly code?: string;
  /** Optional normalized field validation errors. */
  readonly fieldErrors?: AuthFieldErrors;

  /**
   * Creates a normalized API error.
   *
   * @param error - Safe frontend error details.
   */
  constructor(error: ApiError) {
    super(error.message);
    this.name = 'NormalizedApiError';
    this.statusCode = error.statusCode;
    this.code = error.code;
    this.fieldErrors = error.fieldErrors;
  }
}

/**
 * Converts any thrown value into a normalized API error.
 *
 * @param error - Unknown error thrown by axios or application code.
 * @returns A normalized API error safe for UI display.
 */
export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof NormalizedApiError) {
    return {
      code: error.code,
      fieldErrors: error.fieldErrors,
      message: error.message,
      statusCode: error.statusCode,
    };
  }

  if (isAxiosError(error)) {
    return normalizeAxiosError(error);
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: 'Something went wrong. Please try again.' };
}

/**
 * Throws a normalized API error from any unknown failure.
 *
 * @param error - Unknown error thrown by axios or application code.
 * @throws NormalizedApiError every time.
 */
export function throwNormalizedApiError(error: unknown): never {
  throw new NormalizedApiError(normalizeApiError(error));
}

/**
 * Normalizes an axios error from REST or GraphQL responses.
 *
 * @param error - Axios error returned by a backend request.
 * @returns A normalized API error.
 */
function normalizeAxiosError(error: AxiosError): ApiError {
  if (!error.response) {
    return { message: 'Network error. Check that the selected backend is running.' };
  }

  const graphqlError = normalizeGraphqlError(error.response.data);

  if (graphqlError) {
    return graphqlError;
  }

  const restError = error.response.data as RestErrorResponse;

  return {
    fieldErrors: restError.issues?.fieldErrors,
    message: restError.message ?? 'Request failed. Please try again.',
    statusCode: error.response.status,
  };
}

/**
 * Normalizes a GraphQL error response when present.
 *
 * @param data - Unknown axios response body.
 * @returns A normalized API error or null for non-GraphQL responses.
 */
function normalizeGraphqlError(data: unknown): ApiError | null {
  const response = data as GraphqlErrorResponse;
  const firstError = response.errors?.[0];

  if (!firstError) {
    return null;
  }

  return {
    code: firstError.extensions?.code,
    fieldErrors: firstError.extensions?.issues?.fieldErrors,
    message: firstError.message ?? 'GraphQL request failed. Please try again.',
    statusCode: firstError.extensions?.statusCode,
  };
}
