import type { WorkspaceItem } from '../types/workspace.types';

/**
 * Checks whether an item can be opened from the explorer.
 *
 * @param item - Workspace item to inspect.
 * @returns True when the item supports navigation.
 */
export function canOpenItem(item: WorkspaceItem): boolean {
  return item.kind === 'folder';
}

/**
 * Checks whether the current user may rename an item.
 *
 * @param item - Workspace item to inspect.
 * @returns True when rename controls should be available.
 */
export function canRenameItem(item: WorkspaceItem): boolean {
  return item.canWrite;
}

/**
 * Checks whether the current user may move an item.
 *
 * @param item - Workspace item to inspect.
 * @returns True when move controls should be available.
 */
export function canMoveItem(item: WorkspaceItem): boolean {
  return item.canWrite;
}

/**
 * Checks whether the current user may share an item.
 *
 * @param item - Workspace item to inspect.
 * @returns True when share controls should be available.
 */
export function canShareItem(item: WorkspaceItem): boolean {
  return item.canManage;
}

/**
 * Checks whether the current user may delete an item.
 *
 * @param item - Workspace item to inspect.
 * @returns True when delete controls should be available.
 */
export function canDeleteItem(item: WorkspaceItem): boolean {
  return item.canDelete;
}

/**
 * Checks whether an item is read-only for the current user.
 *
 * @param item - Workspace item to inspect.
 * @returns True when write/destructive actions should be hidden.
 */
export function isReadOnlyItem(item: WorkspaceItem): boolean {
  return !item.canWrite;
}
