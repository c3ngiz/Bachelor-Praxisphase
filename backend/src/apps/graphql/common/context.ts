import type { ExpressContextFunctionArgument } from "@as-integrations/express4";
import { verifyAccessToken } from "../../../shared/security/jwt.js";
import type { GraphqlAuthUser } from "../auth/auth.dto.js";
import { toGraphqlAuthUser } from "../auth/auth.mapper.js";
import { findGraphqlAuthUserById } from "../auth/auth.repository.js";

export type GraphqlBackendContext = {
  authUser: GraphqlAuthUser | null;
};

function parseAuthorizationHeader(value: string | undefined): string | null {
  if (!value?.startsWith("Bearer ")) {
    return null;
  }

  return value.slice("Bearer ".length);
}

/** Builds Apollo context for the standalone GraphQL backend. */
export async function createGraphqlContext({
  req,
}: ExpressContextFunctionArgument): Promise<GraphqlBackendContext> {
  const token = parseAuthorizationHeader(req.headers.authorization);

  if (!token) {
    return { authUser: null };
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await findGraphqlAuthUserById(payload.sub);
    return { authUser: user ? toGraphqlAuthUser(user) : null };
  } catch {
    return { authUser: null };
  }
}
