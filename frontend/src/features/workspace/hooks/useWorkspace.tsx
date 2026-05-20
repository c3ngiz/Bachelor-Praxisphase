import { useMemo, useState } from 'react';

import { countWorkspaceItems, filterWorkspaceItems } from '../utils/workspaceFormatting';
import {
  useCreateDocument,
  useCreateFolder,
  useDeleteItem,
  useMoveItem,
  useRenameItem,
  useShareItem,
} from './useWorkspaceActions';
import { useWorkspaceItems } from './useWorkspaceItems';
import { workspaceService } from '../services/workspaceService';
import type { EntityId, WorkspaceFilter, WorkspaceItem } from '../types/workspace.types';

/** Return value for the composed workspace dashboard hook. */
export interface UseWorkspaceResult {
  /** Current folder identifier, or null for root. */
  folderId: EntityId | null;
  /** Raw folder items returned by the backend. */
  items: WorkspaceItem[];
  /** Items after search and sidebar filtering. */
  visibleItems: WorkspaceItem[];
  /** Counts used by the sidebar filters. */
  itemCounts: Record<WorkspaceFilter, number>;
  /** Current folder breadcrumb path. */
  breadcrumbs: ReturnType<typeof useWorkspaceItems>['breadcrumbs'];
  /** Whether the folder listing is loading. */
  isLoading: boolean;
  /** Folder listing error, when available. */
  error: ReturnType<typeof useWorkspaceItems>['error'];
  /** Current search query. */
  searchQuery: string;
  /** Updates the search query. */
  setSearchQuery: (query: string) => void;
  /** Active sidebar filter. */
  activeFilter: WorkspaceFilter;
  /** Updates the sidebar filter. */
  setActiveFilter: (filter: WorkspaceFilter) => void;
  /** Reloads the current folder. */
  refresh: () => Promise<void>;
  /** Lists direct collaborators for an item. */
  listCollaborators: typeof workspaceService.listCollaborators;
  /** Creates a folder. */
  createFolder: ReturnType<typeof useCreateFolder>['createFolder'];
  /** Creates a document shell. */
  createDocument: ReturnType<typeof useCreateDocument>['createDocument'];
  /** Renames an item. */
  renameItem: ReturnType<typeof useRenameItem>['renameItem'];
  /** Deletes an item. */
  deleteItem: ReturnType<typeof useDeleteItem>['deleteItem'];
  /** Moves an item. */
  moveItem: ReturnType<typeof useMoveItem>['moveItem'];
  /** Loads move destinations for an item. */
  loadMoveTargets: ReturnType<typeof useMoveItem>['loadMoveTargets'];
  /** Available move destinations. */
  moveTargets: ReturnType<typeof useMoveItem>['moveTargets'];
  /** Shares an item with another user. */
  shareItem: ReturnType<typeof useShareItem>['shareItem'];
  /** Updates collaborator access. */
  updateCollaborator: ReturnType<typeof useShareItem>['updateCollaborator'];
  /** Removes collaborator access. */
  removeCollaborator: ReturnType<typeof useShareItem>['removeCollaborator'];
  /** Whether any create action is pending. */
  isCreating: boolean;
  /** Whether rename is pending. */
  isRenaming: boolean;
  /** Whether deletion is pending. */
  isDeleting: boolean;
  /** Whether move is pending. */
  isMoving: boolean;
  /** Whether move destinations are loading. */
  isLoadingMoveTargets: boolean;
  /** Whether share mutation is pending. */
  isSharing: boolean;
  /** Last mutation error, when available. */
  mutationError: ReturnType<typeof useCreateFolder>['error'];
}

/**
 * Composes workspace data, local filtering, and mutation hooks for the page.
 *
 * @param folderId - Folder identifier, or null for root.
 * @returns Dashboard state and actions.
 */
export function useWorkspace(folderId: EntityId | null): UseWorkspaceResult {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<WorkspaceFilter>('all');
  const itemsState = useWorkspaceItems(folderId);

  const createFolder = useCreateFolder({ onSuccess: itemsState.upsertItem });
  const createDocument = useCreateDocument({ onSuccess: itemsState.upsertItem });
  const renameItem = useRenameItem({ onSuccess: itemsState.upsertItem });
  const deleteItem = useDeleteItem({
    onSuccess: (_result, input) => itemsState.removeItem(input.itemId),
  });
  const moveItem = useMoveItem({ onSuccess: itemsState.upsertItem });
  const shareItem = useShareItem({ onSuccess: itemsState.upsertItem });

  const visibleItems = useMemo(
    () => filterWorkspaceItems(itemsState.items, searchQuery, activeFilter),
    [activeFilter, itemsState.items, searchQuery],
  );
  const itemCounts = useMemo(() => countWorkspaceItems(itemsState.items), [itemsState.items]);

  return {
    activeFilter,
    breadcrumbs: itemsState.breadcrumbs,
    createDocument: createDocument.createDocument,
    createFolder: createFolder.createFolder,
    deleteItem: deleteItem.deleteItem,
    error: itemsState.error,
    folderId,
    isCreating: createFolder.isCreatingFolder || createDocument.isCreatingDocument,
    isDeleting: deleteItem.isDeleting,
    isLoading: itemsState.isLoading,
    isLoadingMoveTargets: moveItem.isLoadingMoveTargets,
    isMoving: moveItem.isMoving,
    isRenaming: renameItem.isRenaming,
    isSharing: shareItem.isSharing,
    itemCounts,
    items: itemsState.items,
    listCollaborators: workspaceService.listCollaborators,
    loadMoveTargets: moveItem.loadMoveTargets,
    moveItem: moveItem.moveItem,
    moveTargets: moveItem.moveTargets,
    mutationError:
      createFolder.error ??
      createDocument.error ??
      renameItem.error ??
      deleteItem.error ??
      moveItem.error ??
      shareItem.error,
    refresh: itemsState.refresh,
    removeCollaborator: shareItem.removeCollaborator,
    renameItem: renameItem.renameItem,
    searchQuery,
    setActiveFilter,
    setSearchQuery,
    shareItem: shareItem.shareItem,
    updateCollaborator: shareItem.updateCollaborator,
    visibleItems,
  };
}
