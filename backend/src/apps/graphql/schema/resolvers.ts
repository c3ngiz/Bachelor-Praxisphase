import { jsonScalar } from "../common/scalars/jsonScalar.js";
import { graphqlAuthMutations, graphqlAuthQueries } from "../auth/auth.resolver.js";
import {
  graphqlDocumentMutations,
  graphqlDocumentQueries,
} from "../documents/document.resolver.js";
import {
  graphqlWorkspaceMutations,
  graphqlWorkspaceQueries,
} from "../workspaces/workspace.resolver.js";

/** Root resolver map for the standalone GraphQL backend. */
export const resolvers = {
  JSON: jsonScalar,
  Query: {
    ...graphqlAuthQueries,
    ...graphqlDocumentQueries,
    ...graphqlWorkspaceQueries,
  },
  Mutation: {
    ...graphqlAuthMutations,
    ...graphqlDocumentMutations,
    ...graphqlWorkspaceMutations,
  },
};
