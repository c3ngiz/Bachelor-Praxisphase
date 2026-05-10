import { FileText, FolderClosed } from 'lucide-react';

import { Badge, Table } from '../../../shared/components';
import {
  formatWorkspaceDate,
  getPermissionLabel,
  getSharingStatusLabel,
  getWorkspaceFolderPath,
  getWorkspaceItemTypeLabel,
} from '../utils/workspaceFormatting';
import { WorkspaceItemActions } from './WorkspaceItemActions';
import type { PermissionLevel, SharingStatus, WorkspaceItem } from '../types/workspace.types';

/** Props for the workspace item table. */
export interface WorkspaceItemTableProps {
  /** Items displayed in the table. */
  items: WorkspaceItem[];
  /** Navigates into a folder. */
  onOpenFolder: (item: WorkspaceItem) => void;
  /** Starts the rename flow. */
  onRename: (item: WorkspaceItem) => void;
  /** Starts the move flow. */
  onMove: (item: WorkspaceItem) => void;
  /** Starts the share flow. */
  onShare: (item: WorkspaceItem) => void;
  /** Starts the delete flow. */
  onDelete: (item: WorkspaceItem) => void;
}

/**
 * Renders workspace items in a file-manager style list view.
 *
 * @param props - Table props.
 * @returns Workspace item table.
 */
export function WorkspaceItemTable({
  items,
  onDelete,
  onMove,
  onOpenFolder,
  onRename,
  onShare,
}: WorkspaceItemTableProps): JSX.Element {
  return (
    <Table.Wrapper>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>Name</Table.Head>
            <Table.Head>Type</Table.Head>
            <Table.Head>Owner</Table.Head>
            <Table.Head>Modified</Table.Head>
            <Table.Head>Sharing</Table.Head>
            <Table.Head>Permission</Table.Head>
            <Table.Head className="w-16">
              <span className="sr-only">Actions</span>
            </Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {items.map((item) => {
            const Icon = item.kind === 'folder' ? FolderClosed : FileText;

            return (
              <Table.Row
                key={item.id}
                onDoubleClick={() => item.kind === 'folder' && onOpenFolder(item)}
              >
                <Table.Cell className="min-w-64">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={[
                        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border',
                        item.kind === 'folder'
                          ? 'border-amber-200 bg-amber-50 text-amber-700'
                          : 'border-sky-200 bg-sky-50 text-sky-700',
                      ].join(' ')}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      {item.kind === 'folder' ? (
                        <a
                          className="block truncate font-medium text-slate-950 underline-offset-4 hover:underline"
                          href={getWorkspaceFolderPath(item.id)}
                          onClick={(event) => {
                            event.preventDefault();
                            onOpenFolder(item);
                          }}
                        >
                          {item.name}
                        </a>
                      ) : (
                        <span className="block truncate font-medium text-slate-950">
                          {item.name}
                        </span>
                      )}
                      {item.kind === 'folder' && typeof item.childCount === 'number' ? (
                        <span className="text-xs text-slate-500">
                          {item.childCount} {item.childCount === 1 ? 'item' : 'items'}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Table.Cell>
                <Table.Cell>{getWorkspaceItemTypeLabel(item)}</Table.Cell>
                <Table.Cell>{item.owner.name}</Table.Cell>
                <Table.Cell>{formatWorkspaceDate(item.updatedAt)}</Table.Cell>
                <Table.Cell>
                  <SharingBadge sharingStatus={item.sharingStatus} />
                </Table.Cell>
                <Table.Cell>
                  <PermissionBadge permission={item.permission} />
                </Table.Cell>
                <Table.Cell>
                  <WorkspaceItemActions
                    item={item}
                    onDelete={onDelete}
                    onMove={onMove}
                    onRename={onRename}
                    onShare={onShare}
                  />
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
    </Table.Wrapper>
  );
}

interface SharingBadgeProps {
  /** Sharing state to render. */
  sharingStatus: SharingStatus;
}

/** Renders a sharing status badge. */
function SharingBadge({ sharingStatus }: SharingBadgeProps): JSX.Element {
  const variant =
    sharingStatus === 'private'
      ? 'default'
      : sharingStatus === 'shared-by-me'
        ? 'success'
        : 'warning';

  return <Badge variant={variant}>{getSharingStatusLabel(sharingStatus)}</Badge>;
}

interface PermissionBadgeProps {
  /** Permission level to render. */
  permission: PermissionLevel;
}

/** Renders a permission badge. */
function PermissionBadge({ permission }: PermissionBadgeProps): JSX.Element {
  const variant =
    permission === 'owner' ? 'success' : permission === 'write' ? 'warning' : 'default';

  return <Badge variant={variant}>{getPermissionLabel(permission)}</Badge>;
}
