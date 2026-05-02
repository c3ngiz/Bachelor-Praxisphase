import { StatusCodes } from "http-status-codes";
import { GraphqlBackendError } from "../common/errors.js";
import type { GraphqlBackendContext } from "../common/context.js";
import { getGraphqlMe, loginGraphqlUser, registerGraphqlUser } from "./auth.service.js";
import { graphqlLoginDto, graphqlRegisterDto } from "./auth.dto.js";

/** Requires an authenticated GraphQL user. */
export function requireGraphqlAuth(context: GraphqlBackendContext) {
  if (!context.authUser) {
    throw new GraphqlBackendError(StatusCodes.UNAUTHORIZED, "Authentication is required.");
  }

  return context.authUser;
}

/** GraphQL auth query resolvers. */
export const graphqlAuthQueries = {
  me(_parent: unknown, _args: unknown, context: GraphqlBackendContext) {
    const authUser = requireGraphqlAuth(context);
    return getGraphqlMe(authUser.id);
  },
};

/** GraphQL auth mutation resolvers. */
export const graphqlAuthMutations = {
  register(_parent: unknown, args: { input: unknown }) {
    return registerGraphqlUser(graphqlRegisterDto.parse(args.input));
  },

  login(_parent: unknown, args: { input: unknown }) {
    return loginGraphqlUser(graphqlLoginDto.parse(args.input));
  },
};
