import { Edit3, FolderInput, MoreVertical, Share2, Trash2 } from 'lucide-react';

import { Button, Dropdown } from '../../../shared/components';
import {
  canDeleteItem,
  canMoveItem,
  canRenameItem,
  canShareItem,
} from '../utils/workspacePermissions';
import type { WorkspaceItem } from '../types/workspace.types';

/** Props for the workspace item action menu. */
export interface WorkspaceItemActionsProps {
  /** Item whose actions should be rendered. */
  item: WorkspaceItem;
  /** Starts the rename flow. */
  onRename: (item: WorkspaceItem) => void;
  /** Starts the move flow. */
  onMove: (item: WorkspaceItem) => void;
  /** Starts the share flow. */
  onShare: (item: WorkspaceItem) => void;
  /** Starts the delete confirmation flow. */
  onDelete: (item: WorkspaceItem) => void;
}

/** Renders permission-aware dropdown actions for a workspace item. */
export function WorkspaceItemActions({
  item,
  onDelete,
  onMove,
  onRename,
  onShare,
}: WorkspaceItemActionsProps): JSX.Element {
  const hasManageAction =
    canRenameItem(item) || canMoveItem(item) || canShareItem(item) || canDeleteItem(item);

  if (!hasManageAction) {
    return <span className="text-xs text-slate-400">Read only</span>;
  }

  return (
    <Dropdown.Root>
      <Dropdown.Trigger>
        <Button aria-label={`Open actions for ${item.name}`} iconOnly size="sm" variant="ghost">
          <MoreVertical className="h-4 w-4" aria-hidden="true" />
        </Button>
      </Dropdown.Trigger>
      <Dropdown.Content align="end" className="w-44">
        {canRenameItem(item) ? (
          <Dropdown.Item onClick={() => onRename(item)}>
            <Edit3 className="mr-2 h-4 w-4" aria-hidden="true" />
            Rename
          </Dropdown.Item>
        ) : null}
        {canMoveItem(item) ? (
          <Dropdown.Item onClick={() => onMove(item)}>
            <FolderInput className="mr-2 h-4 w-4" aria-hidden="true" />
            Move
          </Dropdown.Item>
        ) : null}
        {canShareItem(item) ? (
          <Dropdown.Item onClick={() => onShare(item)}>
            <Share2 className="mr-2 h-4 w-4" aria-hidden="true" />
            Share
          </Dropdown.Item>
        ) : null}
        {canDeleteItem(item) ? (
          <Dropdown.Item
            className="text-red-700 hover:bg-red-50 focus:bg-red-50"
            onClick={() => onDelete(item)}
          >
            <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
            Delete
          </Dropdown.Item>
        ) : null}
      </Dropdown.Content>
    </Dropdown.Root>
  );
}
