import type { GraphqlBackendContext } from "../common/context.js";
import { requireGraphqlAuth } from "../auth/auth.resolver.js";
import {
  createDocumentDto,
  createFolderDto,
  moveWorkspaceItemDto,
  renameWorkspaceItemDto,
  shareWorkspaceItemDto,
  updateWorkspaceCollaboratorDto,
} from "../../../workspace/workspace.dto.js";
import {
  createDocument,
  createFolder,
  deleteWorkspaceItem,
  getWorkspaceItem,
  listItemCollaborators,
  listMoveTargets,
  listWorkspaceItems,
  moveWorkspaceItem,
  removeWorkspaceCollaborator,
  renameWorkspaceItem,
  shareWorkspaceItem,
  updateWorkspaceCollaborator,
} from "../../../workspace/workspace.service.js";

/** GraphQL workspace query resolvers. */
export const graphqlWorkspaceItemQueries = {
  workspaceItems(
    _parent: unknown,
    args: { parentId?: string | null },
    context: GraphqlBackendContext,
  ) {
    const authUser = requireGraphqlAuth(context);
    return listWorkspaceItems(args.parentId ?? null, authUser);
  },

  workspaceItem(_parent: unknown, args: { id: string }, context: GraphqlBackendContext) {
    const authUser = requireGraphqlAuth(context);
    return getWorkspaceItem(args.id, authUser);
  },

  itemCollaborators(_parent: unknown, args: { itemId: string }, context: GraphqlBackendContext) {
    const authUser = requireGraphqlAuth(context);
    return listItemCollaborators(args.itemId, authUser);
  },

  moveTargets(_parent: unknown, args: { excludeItemId: string }, context: GraphqlBackendContext) {
    const authUser = requireGraphqlAuth(context);
    return listMoveTargets(args.excludeItemId, authUser);
  },
};

/** GraphQL workspace mutation resolvers. */
export const graphqlWorkspaceItemMutations = {
  createFolder(_parent: unknown, args: { input: unknown }, context: GraphqlBackendContext) {
    const authUser = requireGraphqlAuth(context);
    return createFolder(createFolderDto.parse(args.input), authUser);
  },

  createDocument(_parent: unknown, args: { input: unknown }, context: GraphqlBackendContext) {
    const authUser = requireGraphqlAuth(context);
    return createDocument(createDocumentDto.parse(args.input), authUser);
  },

  createWorkspaceDocument(
    _parent: unknown,
    args: { input: unknown },
    context: GraphqlBackendContext,
  ) {
    const authUser = requireGraphqlAuth(context);
    return createDocument(createDocumentDto.parse(args.input), authUser);
  },

  renameWorkspaceItem(
    _parent: unknown,
    args: { input?: { itemId: string; name: string }; itemId?: string; name?: string },
    context: GraphqlBackendContext,
  ) {
    const authUser = requireGraphqlAuth(context);
    const itemId = args.input?.itemId ?? args.itemId ?? "";
    const input = renameWorkspaceItemDto.parse({ name: args.input?.name ?? args.name });
    return renameWorkspaceItem(itemId, input, authUser);
  },

  moveWorkspaceItem(
    _parent: unknown,
    args: {
      input?: { itemId: string; targetFolderId?: string | null };
      itemId?: string;
      targetFolderId?: string | null;
    },
    context: GraphqlBackendContext,
  ) {
    const authUser = requireGraphqlAuth(context);
    const itemId = args.input?.itemId ?? args.itemId ?? "";
    const input = moveWorkspaceItemDto.parse({
      targetFolderId: args.input?.targetFolderId ?? args.targetFolderId ?? null,
    });
    return moveWorkspaceItem(itemId, input, authUser);
  },

  async deleteWorkspaceItem(
    _parent: unknown,
    args: { id?: string; itemId?: string },
    context: GraphqlBackendContext,
  ) {
    const authUser = requireGraphqlAuth(context);
    await deleteWorkspaceItem(args.id ?? args.itemId ?? "", authUser);
    return { success: true };
  },

  shareWorkspaceItem(
    _parent: unknown,
    args: {
      input?: { itemId?: string; email: string; permission?: string; role?: string };
      itemId?: string;
    },
    context: GraphqlBackendContext,
  ) {
    const authUser = requireGraphqlAuth(context);
    const itemId = args.input?.itemId ?? args.itemId ?? "";
    const input = shareWorkspaceItemDto.parse(args.input);
    return shareWorkspaceItem(itemId, input, authUser);
  },

  updateWorkspaceCollaborator(
    _parent: unknown,
    args: {
      input?: { itemId: string; userId?: string; collaboratorId?: string; permission?: string; role?: string };
      itemId?: string;
      collaboratorId?: string;
      permission?: string;
    },
    context: GraphqlBackendContext,
  ) {
    const authUser = requireGraphqlAuth(context);
    const itemId = args.input?.itemId ?? args.itemId ?? "";
    const userId = args.input?.userId ?? args.input?.collaboratorId ?? args.collaboratorId ?? "";
    const input = updateWorkspaceCollaboratorDto.parse({
      permission: args.input?.permission ?? args.permission,
      role: args.input?.role,
    });
    return updateWorkspaceCollaborator(itemId, userId, input, authUser);
  },

  removeWorkspaceCollaborator(
    _parent: unknown,
    args: {
      input?: { itemId: string; userId?: string; collaboratorId?: string };
      itemId?: string;
      collaboratorId?: string;
    },
    context: GraphqlBackendContext,
  ) {
    const authUser = requireGraphqlAuth(context);
    const itemId = args.input?.itemId ?? args.itemId ?? "";
    const userId = args.input?.userId ?? args.input?.collaboratorId ?? args.collaboratorId ?? "";
    return removeWorkspaceCollaborator(itemId, userId, authUser);
  },
};
