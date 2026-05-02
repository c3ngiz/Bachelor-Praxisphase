import { StatusCodes } from "http-status-codes";
import * as authService from "../../../modules/auth/auth.service.js";
import { loginSchema, registerSchema } from "../../../modules/auth/auth.schemas.js";
import * as documentService from "../../../modules/documents/document.service.js";
import {
  createDocumentSchema,
  inviteDocumentCollaboratorSchema,
  updateDocumentSchema,
} from "../../../modules/documents/document.schemas.js";
import * as workspaceService from "../../../modules/workspaces/workspace.service.js";
import {
  createWorkspaceSchema,
  inviteWorkspaceMemberSchema,
} from "../../../modules/workspaces/workspace.schemas.js";
import { ApiError } from "../../../utils/apiError.js";
import { createDocumentUpdateAsyncIterable } from "../../sync/providers/documentEventProvider.js";
import type { GraphqlContext } from "../providers/graphqlContextProvider.js";

function requireGraphqlAuth(context: GraphqlContext) {
  if (!context.authUser) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Authentication is required.");
  }

  return context.authUser;
}

export const graphqlRootValue = {
  me(_args: unknown, context: GraphqlContext) {
    const authUser = requireGraphqlAuth(context);
    return authService.getMe(authUser.id);
  },

  documents(args: { workspaceId?: string }, context: GraphqlContext) {
    const authUser = requireGraphqlAuth(context);
    return documentService.listDocuments(authUser.id, args.workspaceId);
  },

  document(args: { documentId: string }, context: GraphqlContext) {
    const authUser = requireGraphqlAuth(context);
    return documentService.getDocumentById(args.documentId, authUser.id);
  },

  workspaces(_args: unknown, context: GraphqlContext) {
    const authUser = requireGraphqlAuth(context);
    return workspaceService.listWorkspaces(authUser.id);
  },

  register(args: { input: unknown }) {
    return authService.register(registerSchema.parse(args.input));
  },

  login(args: { input: unknown }) {
    return authService.login(loginSchema.parse(args.input));
  },

  createDocument(args: { input: unknown }, context: GraphqlContext) {
    const authUser = requireGraphqlAuth(context);
    return documentService.createDocument(createDocumentSchema.parse(args.input), authUser);
  },

  updateDocument(args: { documentId: string; input: unknown }, context: GraphqlContext) {
    const authUser = requireGraphqlAuth(context);
    return documentService.updateDocument(
      args.documentId,
      updateDocumentSchema.parse(args.input),
      authUser,
    );
  },

  inviteDocumentCollaborator(
    args: { documentId: string; input: unknown },
    context: GraphqlContext,
  ) {
    const authUser = requireGraphqlAuth(context);
    return documentService.inviteDocumentCollaborator(
      args.documentId,
      inviteDocumentCollaboratorSchema.parse(args.input),
      authUser,
    );
  },

  async deleteDocument(args: { documentId: string }, context: GraphqlContext) {
    const authUser = requireGraphqlAuth(context);
    await documentService.deleteDocument(args.documentId, authUser);
    return { success: true };
  },

  createWorkspace(args: { input: unknown }, context: GraphqlContext) {
    const authUser = requireGraphqlAuth(context);
    return workspaceService.createWorkspace(createWorkspaceSchema.parse(args.input), authUser);
  },

  inviteWorkspaceMember(args: { workspaceId: string; input: unknown }, context: GraphqlContext) {
    const authUser = requireGraphqlAuth(context);
    return workspaceService.inviteWorkspaceMember(
      args.workspaceId,
      inviteWorkspaceMemberSchema.parse(args.input),
      authUser,
    );
  },

  async documentUpdated(args: { documentId: string }, context: GraphqlContext) {
    const authUser = requireGraphqlAuth(context);
    await documentService.getDocumentById(args.documentId, authUser.id);
    return createDocumentUpdateAsyncIterable(args.documentId);
  },
};
