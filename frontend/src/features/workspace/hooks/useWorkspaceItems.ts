import { useCallback, useEffect, useRef, useState } from 'react';

import { normalizeApiError } from '../../auth/api/authApiError';
import { workspaceService } from '../services/workspaceService';
import type { ApiError } from '../../auth/types/auth.types';
import type { EntityId, WorkspaceBreadcrumb, WorkspaceItem } from '../types/workspace.types';

/** Return value for loading and updating the current folder listing. */
export interface UseWorkspaceItemsResult {
  /** Current folder identifier, or null for root. */
  folderId: EntityId | null;
  /** Items currently displayed in the folder. */
  items: WorkspaceItem[];
  /** Breadcrumb path for the current folder. */
  breadcrumbs: WorkspaceBreadcrumb[];
  /** Whether the folder listing is loading. */
  isLoading: boolean;
  /** Last folder listing error, when available. */
  error: ApiError | null;
  /** Reloads the current folder from the workspace service. */
  refresh: () => Promise<void>;
  /** Inserts or replaces a single item in the current folder state. */
  upsertItem: (item: WorkspaceItem) => void;
  /** Removes a single item from the current folder state. */
  removeItem: (itemId: EntityId) => void;
}

/**
 * Loads workspace items for a folder and exposes local item update helpers.
 *
 * @param folderId - Folder identifier, or null for root.
 * @returns Current folder API state and local update helpers.
 */
export function useWorkspaceItems(folderId: EntityId | null): UseWorkspaceItemsResult {
  const [items, setItems] = useState<WorkspaceItem[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<WorkspaceBreadcrumb[]>([
    { id: null, name: 'Workspace' },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoading(true);
    setError(null);

    try {
      const result = await workspaceService.listItems(folderId);

      if (requestIdRef.current !== requestId) {
        return;
      }

      setItems(result.items);
      setBreadcrumbs(result.breadcrumbs);
    } catch (requestError) {
      if (requestIdRef.current === requestId) {
        setError(normalizeApiError(requestError));
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }, [folderId]);

  const upsertItem = useCallback(
    (item: WorkspaceItem) => {
      setItems((currentItems) => {
        if (item.parentId !== folderId) {
          return currentItems.filter((currentItem) => currentItem.id !== item.id);
        }

        const existingIndex = currentItems.findIndex((currentItem) => currentItem.id === item.id);

        if (existingIndex === -1) {
          return [item, ...currentItems];
        }

        return currentItems.map((currentItem) => (currentItem.id === item.id ? item : currentItem));
      });
    },
    [folderId],
  );

  const removeItem = useCallback((itemId: EntityId) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    breadcrumbs,
    error,
    folderId,
    isLoading,
    items,
    refresh,
    removeItem,
    upsertItem,
  };
}
