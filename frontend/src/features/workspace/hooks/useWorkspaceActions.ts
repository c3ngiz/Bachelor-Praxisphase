import { useCallback, useState } from 'react';

import { normalizeApiError } from '../../auth/api/authApiError';
import { workspaceService } from '../services/workspaceService';
import type { ApiError } from '../../auth/types/auth.types';
import type {
  CreateDocumentInput,
  CreateFolderInput,
  DeleteItemInput,
  DocumentItem,
  FolderItem,
  MoveItemInput,
  MoveTarget,
  RemoveCollaboratorInput,
  RenameItemInput,
  ShareInvite,
  UpdateCollaboratorInput,
  WorkspaceItem,
} from '../types/workspace.types';

interface WorkspaceMutationOptions<TResult, TInput> {
  /** Callback fired after a mutation succeeds. */
  onSuccess?: (result: TResult, input: TInput) => void;
}

interface WorkspaceMutationResult<TInput, TResult> {
  /** Whether the mutation is pending. */
  isLoading: boolean;
  /** Last mutation error, when available. */
  error: ApiError | null;
  /** Clears the current mutation error. */
  resetError: () => void;
  /** Runs the mutation. */
  execute: (input: TInput) => Promise<TResult>;
}

/**
 * Creates shared loading/error behavior for workspace mutations.
 *
 * @param request - Mutation function.
 * @param options - Optional mutation lifecycle callbacks.
 * @returns Mutation state and executor.
 */
function useWorkspaceMutation<TInput, TResult>(
  request: (input: TInput) => Promise<TResult>,
  options: WorkspaceMutationOptions<TResult, TInput> = {},
): WorkspaceMutationResult<TInput, TResult> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const resetError = useCallback(() => setError(null), []);

  const execute = useCallback(
    async (input: TInput) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await request(input);
        options.onSuccess?.(result, input);
        return result;
      } catch (requestError) {
        const normalizedError = normalizeApiError(requestError);
        setError(normalizedError);
        throw normalizedError;
      } finally {
        setIsLoading(false);
      }
    },
    [options, request],
  );

  return { error, execute, isLoading, resetError };
}

/** Return value for the create-folder hook. */
export interface UseCreateFolderResult {
  /** Creates a folder. */
  createFolder: (input: CreateFolderInput) => Promise<FolderItem>;
  /** Whether folder creation is pending. */
  isCreatingFolder: boolean;
  /** Last creation error, when available. */
  error: ApiError | null;
}

/**
 * Creates folders through the workspace service.
 *
 * @param options - Optional success callback.
 * @returns Folder creation state and action.
 */
export function useCreateFolder(
  options: WorkspaceMutationOptions<FolderItem, CreateFolderInput> = {},
): UseCreateFolderResult {
  const mutation = useWorkspaceMutation(workspaceService.createFolder, options);

  return {
    createFolder: mutation.execute,
    error: mutation.error,
    isCreatingFolder: mutation.isLoading,
  };
}

/** Return value for the create-document hook. */
export interface UseCreateDocumentResult {
  /** Creates a document shell. */
  createDocument: (input: CreateDocumentInput) => Promise<DocumentItem>;
  /** Whether document creation is pending. */
  isCreatingDocument: boolean;
  /** Last creation error, when available. */
  error: ApiError | null;
}

/**
 * Creates document shells through the workspace service.
 *
 * @param options - Optional success callback.
 * @returns Document creation state and action.
 */
export function useCreateDocument(
  options: WorkspaceMutationOptions<DocumentItem, CreateDocumentInput> = {},
): UseCreateDocumentResult {
  const mutation = useWorkspaceMutation(workspaceService.createDocument, options);

  return {
    createDocument: mutation.execute,
    error: mutation.error,
    isCreatingDocument: mutation.isLoading,
  };
}

/** Return value for the rename-item hook. */
export interface UseRenameItemResult {
  /** Renames an item. */
  renameItem: (input: RenameItemInput) => Promise<WorkspaceItem>;
  /** Whether rename is pending. */
  isRenaming: boolean;
  /** Last rename error, when available. */
  error: ApiError | null;
}

/**
 * Renames workspace items through the workspace service.
 *
 * @param options - Optional success callback.
 * @returns Rename state and action.
 */
export function useRenameItem(
  options: WorkspaceMutationOptions<WorkspaceItem, RenameItemInput> = {},
): UseRenameItemResult {
  const mutation = useWorkspaceMutation(workspaceService.renameItem, options);

  return {
    error: mutation.error,
    isRenaming: mutation.isLoading,
    renameItem: mutation.execute,
  };
}

/** Return value for the delete-item hook. */
export interface UseDeleteItemResult {
  /** Deletes an item. */
  deleteItem: (input: DeleteItemInput) => Promise<void>;
  /** Whether deletion is pending. */
  isDeleting: boolean;
  /** Last delete error, when available. */
  error: ApiError | null;
}

/**
 * Deletes workspace items through the workspace service.
 *
 * @param options - Optional success callback.
 * @returns Delete state and action.
 */
export function useDeleteItem(
  options: WorkspaceMutationOptions<void, DeleteItemInput> = {},
): UseDeleteItemResult {
  const mutation = useWorkspaceMutation(workspaceService.deleteItem, options);

  return {
    deleteItem: mutation.execute,
    error: mutation.error,
    isDeleting: mutation.isLoading,
  };
}

/** Return value for the move-item hook. */
export interface UseMoveItemResult {
  /** Moves an item. */
  moveItem: (input: MoveItemInput) => Promise<WorkspaceItem>;
  /** Loads valid move targets for an item. */
  loadMoveTargets: (itemId: string) => Promise<MoveTarget[]>;
  /** Most recently loaded move targets. */
  moveTargets: MoveTarget[];
  /** Whether the move mutation is pending. */
  isMoving: boolean;
  /** Whether move targets are loading. */
  isLoadingMoveTargets: boolean;
  /** Last move-related error, when available. */
  error: ApiError | null;
}

/**
 * Moves workspace items and loads move target options.
 *
 * @param options - Optional success callback.
 * @returns Move state and actions.
 */
export function useMoveItem(
  options: WorkspaceMutationOptions<WorkspaceItem, MoveItemInput> = {},
): UseMoveItemResult {
  const [moveTargets, setMoveTargets] = useState<MoveTarget[]>([]);
  const [isLoadingMoveTargets, setIsLoadingMoveTargets] = useState(false);
  const [targetError, setTargetError] = useState<ApiError | null>(null);
  const mutation = useWorkspaceMutation(workspaceService.moveItem, options);

  const loadMoveTargets = useCallback(async (itemId: string) => {
    setIsLoadingMoveTargets(true);
    setTargetError(null);

    try {
      const targets = await workspaceService.listMoveTargets(itemId);
      setMoveTargets(targets);
      return targets;
    } catch (requestError) {
      const normalizedError = normalizeApiError(requestError);
      setTargetError(normalizedError);
      throw normalizedError;
    } finally {
      setIsLoadingMoveTargets(false);
    }
  }, []);

  return {
    error: mutation.error ?? targetError,
    isLoadingMoveTargets,
    isMoving: mutation.isLoading,
    loadMoveTargets,
    moveItem: mutation.execute,
    moveTargets,
  };
}

/** Return value for the share-item hook. */
export interface UseShareItemResult {
  /** Shares an item with another user. */
  shareItem: (input: ShareInvite) => Promise<WorkspaceItem>;
  /** Updates collaborator access. */
  updateCollaborator: (input: UpdateCollaboratorInput) => Promise<WorkspaceItem>;
  /** Removes collaborator access. */
  removeCollaborator: (input: RemoveCollaboratorInput) => Promise<WorkspaceItem>;
  /** Whether any share mutation is pending. */
  isSharing: boolean;
  /** Last sharing error, when available. */
  error: ApiError | null;
}

/**
 * Manages item sharing through the workspace service.
 *
 * @param options - Optional success callback shared by all share mutations.
 * @returns Sharing state and actions.
 */
export function useShareItem(
  options: WorkspaceMutationOptions<
    WorkspaceItem,
    ShareInvite | UpdateCollaboratorInput | RemoveCollaboratorInput
  > = {},
): UseShareItemResult {
  const shareMutation = useWorkspaceMutation<ShareInvite, WorkspaceItem>(
    workspaceService.shareItem,
    options,
  );
  const updateMutation = useWorkspaceMutation<UpdateCollaboratorInput, WorkspaceItem>(
    workspaceService.updateCollaborator,
    options,
  );
  const removeMutation = useWorkspaceMutation<RemoveCollaboratorInput, WorkspaceItem>(
    workspaceService.removeCollaborator,
    options,
  );

  return {
    error: shareMutation.error ?? updateMutation.error ?? removeMutation.error,
    isSharing: shareMutation.isLoading || updateMutation.isLoading || removeMutation.isLoading,
    removeCollaborator: removeMutation.execute,
    shareItem: shareMutation.execute,
    updateCollaborator: updateMutation.execute,
  };
}
