import type { IncomingMessage } from "node:http";
import type { Request } from "express";
import type { AuthUser } from "../../../modules/auth/auth.types.js";
import { getAuthUserFromToken } from "../../shared/providers/authUserProvider.js";

export type GraphqlContext = {
  authUser: AuthUser | null;
};

function parseAuthorizationHeader(value: string | undefined): string | null {
  if (!value?.startsWith("Bearer ")) {
    return null;
  }

  return value.slice("Bearer ".length);
}

export async function createGraphqlHttpContext(request: Request): Promise<GraphqlContext> {
  return {
    authUser: await getAuthUserFromToken(parseAuthorizationHeader(request.headers.authorization)),
  };
}

export async function createGraphqlWebSocketContext(options: {
  request: IncomingMessage;
  connectionParams?: unknown;
}): Promise<GraphqlContext> {
  const url = new URL(options.request.url ?? "/", "http://localhost");
  const queryToken = url.searchParams.get("token");
  const params =
    typeof options.connectionParams === "object" && options.connectionParams !== null
      ? (options.connectionParams as Record<string, unknown>)
      : {};
  const authorization =
    typeof params.authorization === "string"
      ? params.authorization
      : typeof params.Authorization === "string"
        ? params.Authorization
        : undefined;
  const paramToken = typeof params.token === "string" ? params.token : undefined;
  const token = paramToken ?? parseAuthorizationHeader(authorization) ?? queryToken;

  return {
    authUser: await getAuthUserFromToken(token),
  };
}
