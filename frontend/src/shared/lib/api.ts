export type BackendKind = "rest" | "graphql";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

type RequestOptions = Omit<RequestInit, "body" | "headers"> & {
  token?: string | null;
  body?: unknown;
  headers?: HeadersInit;
};

type GraphqlRequestOptions<TVariables extends Record<string, unknown>> = {
  query: string;
  variables?: TVariables;
  token?: string | null;
};

type GraphqlErrorPayload = {
  message?: string;
  extensions?: {
    statusCode?: number;
    [key: string]: unknown;
  };
};

const DEFAULT_REST_API_URL = "http://localhost:4000/api";
const DEFAULT_GRAPHQL_API_URL = "http://localhost:4000/graphql";

function getImportMetaEnv(): Record<string, string | undefined> {
  return typeof import.meta !== "undefined"
    ? (import.meta.env as Record<string, string | undefined>)
    : {};
}

const env = getImportMetaEnv();

export const BACKEND_KIND: BackendKind =
  env.VITE_BACKEND_KIND === "graphql" ? "graphql" : "rest";

export const REST_API_URL =
  env.VITE_REST_API_URL || env.VITE_API_URL || DEFAULT_REST_API_URL;

export const GRAPHQL_API_URL =
  env.VITE_GRAPHQL_API_URL || DEFAULT_GRAPHQL_API_URL;

export const API_URL = REST_API_URL;

function getRestErrorMessage(data: unknown): string {
  return typeof data === "object" &&
    data !== null &&
    "message" in data &&
    typeof (data as { message?: unknown }).message === "string"
    ? (data as { message: string }).message
    : "Request failed.";
}

function createGraphqlApiError(error: GraphqlErrorPayload): ApiError {
  const extensions = error.extensions ?? {};
  const status =
    typeof extensions.statusCode === "number" ? extensions.statusCode : 500;

  return new ApiError(error.message ?? "GraphQL request failed.", status, extensions);
}

export async function restRequest<T>(
  path: string,
  { token, body, headers, ...init }: RequestOptions = {},
): Promise<T> {
  const response = await fetch(`${REST_API_URL}${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      "Cache-Control": "no-store",
      Pragma: "no-cache",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new ApiError(getRestErrorMessage(data), response.status, data);
  }

  return data as T;
}

export async function graphqlRequest<
  TData,
  TVariables extends Record<string, unknown> = Record<string, unknown>,
>({ query, variables, token }: GraphqlRequestOptions<TVariables>): Promise<TData> {
  const response = await fetch(GRAPHQL_API_URL, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      Pragma: "no-cache",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });
  const payload = (await response.json()) as {
    data?: TData;
    errors?: GraphqlErrorPayload[];
  };

  if (!response.ok) {
    throw new ApiError("GraphQL request failed.", response.status, payload);
  }

  if (payload.errors?.length) {
    throw createGraphqlApiError(payload.errors[0]);
  }

  if (!payload.data) {
    throw new ApiError("GraphQL response did not include data.", 500, payload);
  }

  return payload.data;
}

export const apiRequest = restRequest;
