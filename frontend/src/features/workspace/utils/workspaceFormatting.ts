import { formatDate } from '../../../shared/utils';
import type {
  PermissionLevel,
  SharingStatus,
  WorkspaceFilter,
  WorkspaceItem,
} from '../types/workspace.types';

/**
 * Builds the URL for a workspace folder.
 *
 * @param folderId - Folder identifier, or null for root.
 * @returns Browser path for the folder.
 */
export function getWorkspaceFolderPath(folderId: string | null): string {
  return folderId ? `/workspace/folder/${encodeURIComponent(folderId)}` : '/workspace';
}

/**
 * Builds the URL for a workspace document editor.
 *
 * @param documentId - Document identifier.
 * @returns Browser path for the document editor.
 */
export function getWorkspaceDocumentPath(documentId: string): string {
  return `/workspace/document/${encodeURIComponent(documentId)}`;
}

/**
 * Formats a workspace item kind for display.
 *
 * @param item - Workspace item.
 * @returns Human-readable item type.
 */
export function getWorkspaceItemTypeLabel(item: WorkspaceItem): string {
  return item.kind === 'folder' ? 'Folder' : 'Document';
}

/**
 * Formats a permission level for display.
 *
 * @param permission - Normalized permission level.
 * @returns Human-readable permission label.
 */
export function getPermissionLabel(permission: PermissionLevel): string {
  if (permission === 'owner') {
    return 'Owner';
  }

  return permission === 'write' ? 'Can write' : 'Read only';
}

/**
 * Formats sharing state for display.
 *
 * @param sharingStatus - Normalized sharing state.
 * @returns Human-readable sharing label.
 */
export function getSharingStatusLabel(sharingStatus: SharingStatus): string {
  if (sharingStatus === 'shared-by-me') {
    return 'Shared by me';
  }

  if (sharingStatus === 'shared-with-me') {
    return 'Shared with me';
  }

  return 'Private';
}

/**
 * Formats an ISO timestamp for workspace metadata.
 *
 * @param value - ISO timestamp.
 * @returns Display date.
 */
export function formatWorkspaceDate(value: string): string {
  return formatDate(value);
}

/**
 * Filters workspace items by search query and sidebar filter.
 *
 * @param items - Items in the current folder.
 * @param query - Search query.
 * @param filter - Active sidebar filter.
 * @returns Filtered and sorted workspace items.
 */
export function filterWorkspaceItems(
  items: WorkspaceItem[],
  query: string,
  filter: WorkspaceFilter,
): WorkspaceItem[] {
  const normalizedQuery = query.trim().toLowerCase();

  return sortWorkspaceItems(
    items.filter((item) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.owner.name.toLowerCase().includes(normalizedQuery);
      const matchesFilter = filter === 'all' || item.sharingStatus === filter;

      return matchesQuery && matchesFilter;
    }),
  );
}

/**
 * Counts items by sharing state for sidebar badges.
 *
 * @param items - Items in the current folder.
 * @returns Counts keyed by workspace filter.
 */
export function countWorkspaceItems(items: WorkspaceItem[]): Record<WorkspaceFilter, number> {
  return {
    all: items.length,
    private: items.filter((item) => item.sharingStatus === 'private').length,
    'shared-by-me': items.filter((item) => item.sharingStatus === 'shared-by-me').length,
    'shared-with-me': items.filter((item) => item.sharingStatus === 'shared-with-me').length,
  };
}

/**
 * Sorts folders before documents and then alphabetically by name.
 *
 * @param items - Items to sort.
 * @returns Sorted copy of the item array.
 */
export function sortWorkspaceItems(items: WorkspaceItem[]): WorkspaceItem[] {
  return [...items].sort((left, right) => {
    if (left.kind !== right.kind) {
      return left.kind === 'folder' ? -1 : 1;
    }

    return left.name.localeCompare(right.name, undefined, { sensitivity: 'base' });
  });
}
