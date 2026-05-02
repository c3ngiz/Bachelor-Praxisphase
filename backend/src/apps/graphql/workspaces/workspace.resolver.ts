import type { GraphqlBackendContext } from "../common/context.js";
import { requireGraphqlAuth } from "../auth/auth.resolver.js";
import {
  graphqlCreateWorkspaceDto,
  graphqlInviteWorkspaceMemberDto,
} from "./workspace.dto.js";
import {
  createGraphqlWorkspace,
  inviteGraphqlWorkspaceMember,
  listGraphqlWorkspaces,
} from "./workspace.service.js";

/** GraphQL workspace query resolvers. */
export const graphqlWorkspaceQueries = {
  workspaces(_parent: unknown, _args: unknown, context: GraphqlBackendContext) {
    const authUser = requireGraphqlAuth(context);
    return listGraphqlWorkspaces(authUser.id);
  },
};

/** GraphQL workspace mutation resolvers. */
export const graphqlWorkspaceMutations = {
  createWorkspace(
    _parent: unknown,
    args: { input: unknown },
    context: GraphqlBackendContext,
  ) {
    const authUser = requireGraphqlAuth(context);
    return createGraphqlWorkspace(graphqlCreateWorkspaceDto.parse(args.input), authUser);
  },

  inviteWorkspaceMember(
    _parent: unknown,
    args: { workspaceId: string; input: unknown },
    context: GraphqlBackendContext,
  ) {
    const authUser = requireGraphqlAuth(context);
    return inviteGraphqlWorkspaceMember(
      args.workspaceId,
      graphqlInviteWorkspaceMemberDto.parse(args.input),
      authUser,
    );
  },
};
