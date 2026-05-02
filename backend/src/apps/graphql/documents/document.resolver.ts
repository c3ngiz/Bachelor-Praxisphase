import type { GraphqlBackendContext } from "../common/context.js";
import { requireGraphqlAuth } from "../auth/auth.resolver.js";
import {
  graphqlCreateDocumentDto,
  graphqlInviteDocumentCollaboratorDto,
  graphqlUpdateDocumentDto,
} from "./document.dto.js";
import {
  createGraphqlDocument,
  deleteGraphqlDocument,
  getGraphqlDocumentById,
  inviteGraphqlDocumentCollaborator,
  listGraphqlDocuments,
  updateGraphqlDocument,
} from "./document.service.js";

/** GraphQL document query resolvers. */
export const graphqlDocumentQueries = {
  documents(
    _parent: unknown,
    args: { workspaceId?: string },
    context: GraphqlBackendContext,
  ) {
    const authUser = requireGraphqlAuth(context);
    return listGraphqlDocuments(authUser.id, args.workspaceId);
  },

  document(_parent: unknown, args: { documentId: string }, context: GraphqlBackendContext) {
    const authUser = requireGraphqlAuth(context);
    return getGraphqlDocumentById(args.documentId, authUser.id);
  },
};

/** GraphQL document mutation resolvers. */
export const graphqlDocumentMutations = {
  createDocument(
    _parent: unknown,
    args: { input: unknown },
    context: GraphqlBackendContext,
  ) {
    const authUser = requireGraphqlAuth(context);
    return createGraphqlDocument(graphqlCreateDocumentDto.parse(args.input), authUser);
  },

  updateDocument(
    _parent: unknown,
    args: { documentId: string; input: unknown },
    context: GraphqlBackendContext,
  ) {
    const authUser = requireGraphqlAuth(context);
    return updateGraphqlDocument(
      args.documentId,
      graphqlUpdateDocumentDto.parse(args.input),
      authUser,
    );
  },

  inviteDocumentCollaborator(
    _parent: unknown,
    args: { documentId: string; input: unknown },
    context: GraphqlBackendContext,
  ) {
    const authUser = requireGraphqlAuth(context);
    return inviteGraphqlDocumentCollaborator(
      args.documentId,
      graphqlInviteDocumentCollaboratorDto.parse(args.input),
      authUser,
    );
  },

  async deleteDocument(
    _parent: unknown,
    args: { documentId: string },
    context: GraphqlBackendContext,
  ) {
    const authUser = requireGraphqlAuth(context);
    return {
      success: await deleteGraphqlDocument(args.documentId, authUser),
    };
  },
};
