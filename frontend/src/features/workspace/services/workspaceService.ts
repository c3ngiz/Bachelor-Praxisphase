import { env } from '../../../config/env';
import { GraphqlWorkspaceClient } from '../api/graphql/graphqlWorkspaceClient';
import { RestWorkspaceClient } from '../api/rest/restWorkspaceClient';
import type {
  CreateDocumentInput,
  CreateFolderInput,
  DeleteItemInput,
  DocumentItem,
  EntityId,
  FolderItem,
  MoveItemInput,
  MoveTarget,
  RemoveCollaboratorInput,
  RenameItemInput,
  ShareInvite,
  UpdateCollaboratorInput,
  WorkspaceClient,
  WorkspaceItem,
  WorkspaceItemsResult,
} from '../types/workspace.types';

/**
 * Creates the workspace client selected by the configured backend mode.
 *
 * @returns REST or GraphQL workspace client.
 */
function createWorkspaceClient(): WorkspaceClient {
  if (env.apiMode === 'graphql') {
    return new GraphqlWorkspaceClient();
  }

  return new RestWorkspaceClient();
}

const workspaceClient = createWorkspaceClient();

/** Frontend-facing workspace facade used by hooks and UI components. */
export const workspaceService = {
  /**
   * Lists child items for a folder.
   *
   * @param parentId - Folder identifier, or null for root.
   * @returns Normalized folder contents.
   */
  listItems(parentId: EntityId | null): Promise<WorkspaceItemsResult> {
    return workspaceClient.listItems(parentId);
  },

  /**
   * Creates a folder.
   *
   * @param input - Folder creation input.
   * @returns Created folder.
   */
  createFolder(input: CreateFolderInput): Promise<FolderItem> {
    return workspaceClient.createFolder(input);
  },

  /**
   * Creates a document shell.
   *
   * @param input - Document creation input.
   * @returns Created document.
   */
  createDocument(input: CreateDocumentInput): Promise<DocumentItem> {
    return workspaceClient.createDocument(input);
  },

  /**
   * Renames a document or folder.
   *
   * @param input - Rename input.
   * @returns Updated item.
   */
  renameItem(input: RenameItemInput): Promise<WorkspaceItem> {
    return workspaceClient.renameItem(input);
  },

  /**
   * Deletes a document or folder.
   *
   * @param input - Delete input.
   */
  deleteItem(input: DeleteItemInput): Promise<void> {
    return workspaceClient.deleteItem(input);
  },

  /**
   * Lists valid folder destinations for a move operation.
   *
   * @param itemId - Item being moved.
   * @returns Available move targets.
   */
  listMoveTargets(itemId: EntityId): Promise<MoveTarget[]> {
    return workspaceClient.listMoveTargets(itemId);
  },

  /**
   * Moves a document or folder.
   *
   * @param input - Move input.
   * @returns Updated item.
   */
  moveItem(input: MoveItemInput): Promise<WorkspaceItem> {
    return workspaceClient.moveItem(input);
  },

  /**
   * Shares a document or folder with another user.
   *
   * @param input - Share invite.
   * @returns Updated item.
   */
  shareItem(input: ShareInvite): Promise<WorkspaceItem> {
    return workspaceClient.shareItem(input);
  },

  /**
   * Updates collaborator permission.
   *
   * @param input - Collaborator update input.
   * @returns Updated item.
   */
  updateCollaborator(input: UpdateCollaboratorInput): Promise<WorkspaceItem> {
    return workspaceClient.updateCollaborator(input);
  },

  /**
   * Removes collaborator access.
   *
   * @param input - Collaborator removal input.
   * @returns Updated item.
   */
  removeCollaborator(input: RemoveCollaboratorInput): Promise<WorkspaceItem> {
    return workspaceClient.removeCollaborator(input);
  },
};
