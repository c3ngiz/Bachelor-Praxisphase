import { useEffect, useState } from 'react';

import { Button } from '../../../shared/components';
import { WorkspaceBreadcrumbs } from '../components/WorkspaceBreadcrumbs';
import { WorkspaceEmptyState } from '../components/WorkspaceEmptyState';
import { WorkspaceItemTable } from '../components/WorkspaceItemTable';
import { WorkspaceLoadingState } from '../components/WorkspaceLoadingState';
import { WorkspaceShell } from '../components/WorkspaceShell';
import { WorkspaceSidebar } from '../components/WorkspaceSidebar';
import { WorkspaceToolbar } from '../components/WorkspaceToolbar';
import { CreateWorkspaceItemModal } from '../components/modals/CreateWorkspaceItemModal';
import { DeleteWorkspaceItemModal } from '../components/modals/DeleteWorkspaceItemModal';
import { MoveWorkspaceItemModal } from '../components/modals/MoveWorkspaceItemModal';
import { RenameWorkspaceItemModal } from '../components/modals/RenameWorkspaceItemModal';
import { ShareWorkspaceItemModal } from '../components/modals/ShareWorkspaceItemModal';
import { useWorkspace } from '../hooks/useWorkspace';
import { getWorkspaceFolderPath } from '../utils/workspaceFormatting';
import type {
  Collaborator,
  EntityId,
  PermissionLevel,
  WorkspaceItem,
  WorkspaceItemKind,
} from '../types/workspace.types';

/** Props accepted by the workspace route page. */
export interface WorkspacePageProps {
  /** Folder identifier from `/workspace/folder/:folderId`, or null for root. */
  folderId?: EntityId | null;
  /** Dynamic route parameters supplied by the app router. */
  params?: Record<string, string>;
  /** Matched browser pathname supplied by the app router. */
  pathname?: string;
}

type WorkspaceModalState =
  | { type: 'closed' }
  | { type: 'create'; kind: WorkspaceItemKind }
  | { type: 'rename'; item: WorkspaceItem }
  | { type: 'delete'; item: WorkspaceItem }
  | { type: 'move'; item: WorkspaceItem }
  | { type: 'share'; item: WorkspaceItem };

/** Main workspace dashboard page mounted at `/workspace`. */
export function WorkspacePage({ folderId = null, params }: WorkspacePageProps): JSX.Element {
  const routeFolderId = folderId ?? params?.folderId ?? null;
  const workspace = useWorkspace(routeFolderId);
  const [modal, setModal] = useState<WorkspaceModalState>({ type: 'closed' });
  const [shareCollaborators, setShareCollaborators] = useState<Collaborator[]>([]);
  const [isLoadingShareCollaborators, setIsLoadingShareCollaborators] = useState(false);
  const activeShareItem = modal.type === 'share' ? modal.item : null;

  const closeModal = (): void => setModal({ type: 'closed' });

  async function refreshShareCollaborators(item: WorkspaceItem): Promise<void> {
    setShareCollaborators(item.collaborators);
    setIsLoadingShareCollaborators(true);

    try {
      const collaborators = await workspace.listCollaborators(item.id);
      setShareCollaborators(collaborators);
    } catch {
      setShareCollaborators(item.collaborators);
    } finally {
      setIsLoadingShareCollaborators(false);
    }
  }

  useEffect(() => {
    if (!activeShareItem) {
      setShareCollaborators([]);
      setIsLoadingShareCollaborators(false);
      return;
    }

    let isActive = true;
    setShareCollaborators(activeShareItem.collaborators);
    setIsLoadingShareCollaborators(true);

    workspace
      .listCollaborators(activeShareItem.id)
      .then((collaborators) => {
        if (isActive) {
          setShareCollaborators(collaborators);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (isActive) {
          setIsLoadingShareCollaborators(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [activeShareItem?.id]);

  function handleOpenFolder(item: WorkspaceItem): void {
    if (item.kind !== 'folder') {
      return;
    }

    window.location.assign(getWorkspaceFolderPath(item.id));
  }

  async function handleCreate(name: string): Promise<void> {
    if (modal.type !== 'create') {
      return;
    }

    if (modal.kind === 'folder') {
      await workspace.createFolder({ name, parentId: workspace.folderId });
      return;
    }

    await workspace.createDocument({ name, parentId: workspace.folderId });
  }

  async function handleRename(name: string): Promise<void> {
    if (modal.type !== 'rename') {
      return;
    }

    await workspace.renameItem({ itemId: modal.item.id, name });
  }

  async function handleDelete(): Promise<void> {
    if (modal.type !== 'delete') {
      return;
    }

    await workspace.deleteItem({ itemId: modal.item.id });
  }

  async function handleMove(targetFolderId: EntityId | null): Promise<void> {
    if (modal.type !== 'move') {
      return;
    }

    await workspace.moveItem({ itemId: modal.item.id, targetFolderId });
  }

  async function handleInvite(
    email: string,
    permission: Exclude<PermissionLevel, 'owner'>,
  ): Promise<void> {
    if (modal.type !== 'share') {
      return;
    }

    const item = await workspace.shareItem({ email, itemId: modal.item.id, permission });
    await refreshShareCollaborators(item);
  }

  async function handleUpdateCollaborator(
    collaboratorId: string,
    permission: Exclude<PermissionLevel, 'owner'>,
  ): Promise<void> {
    if (modal.type !== 'share') {
      return;
    }

    const item = await workspace.updateCollaborator({
      collaboratorId,
      itemId: modal.item.id,
      permission,
    });
    await refreshShareCollaborators(item);
  }

  async function handleRemoveCollaborator(collaboratorId: string): Promise<void> {
    if (modal.type !== 'share') {
      return;
    }

    const item = await workspace.removeCollaborator({ collaboratorId, itemId: modal.item.id });
    await refreshShareCollaborators(item);
  }

  return (
    <>
      <WorkspaceShell
        breadcrumbs={<WorkspaceBreadcrumbs breadcrumbs={workspace.breadcrumbs} />}
        sidebar={
          <WorkspaceSidebar
            activeFilter={workspace.activeFilter}
            counts={workspace.itemCounts}
            onFilterChange={workspace.setActiveFilter}
          />
        }
        toolbar={
          <WorkspaceToolbar
            isRefreshing={workspace.isLoading}
            onCreateDocument={() => setModal({ kind: 'document', type: 'create' })}
            onCreateFolder={() => setModal({ kind: 'folder', type: 'create' })}
            onRefresh={() => void workspace.refresh()}
            onSearchChange={workspace.setSearchQuery}
            searchQuery={workspace.searchQuery}
          />
        }
      >
        {workspace.error ? (
          <div
            className="mb-4 flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 sm:flex-row sm:items-center sm:justify-between"
            role="alert"
          >
            <p className="m-0 text-sm">{workspace.error.message}</p>
            <Button onClick={() => void workspace.refresh()} size="sm" variant="secondary">
              Retry
            </Button>
          </div>
        ) : null}

        {workspace.isLoading && workspace.items.length === 0 ? (
          <WorkspaceLoadingState />
        ) : workspace.visibleItems.length > 0 ? (
          <WorkspaceItemTable
            items={workspace.visibleItems}
            onDelete={(item) => setModal({ item, type: 'delete' })}
            onMove={(item) => setModal({ item, type: 'move' })}
            onOpenFolder={handleOpenFolder}
            onRename={(item) => setModal({ item, type: 'rename' })}
            onShare={(item) => setModal({ item, type: 'share' })}
          />
        ) : (
          <WorkspaceEmptyState
            activeFilter={workspace.activeFilter}
            onCreateDocument={() => setModal({ kind: 'document', type: 'create' })}
            onCreateFolder={() => setModal({ kind: 'folder', type: 'create' })}
            searchQuery={workspace.searchQuery}
          />
        )}
      </WorkspaceShell>

      <CreateWorkspaceItemModal
        error={workspace.mutationError}
        isSubmitting={workspace.isCreating}
        kind={modal.type === 'create' ? modal.kind : 'folder'}
        onOpenChange={(open) => !open && closeModal()}
        onSubmit={handleCreate}
        open={modal.type === 'create'}
      />
      <RenameWorkspaceItemModal
        error={workspace.mutationError}
        isSubmitting={workspace.isRenaming}
        item={modal.type === 'rename' ? modal.item : null}
        onOpenChange={(open) => !open && closeModal()}
        onSubmit={handleRename}
        open={modal.type === 'rename'}
      />
      <DeleteWorkspaceItemModal
        error={workspace.mutationError}
        isSubmitting={workspace.isDeleting}
        item={modal.type === 'delete' ? modal.item : null}
        onConfirm={handleDelete}
        onOpenChange={(open) => !open && closeModal()}
        open={modal.type === 'delete'}
      />
      <MoveWorkspaceItemModal
        error={workspace.mutationError}
        isLoadingTargets={workspace.isLoadingMoveTargets}
        isSubmitting={workspace.isMoving}
        item={modal.type === 'move' ? modal.item : null}
        onLoadTargets={workspace.loadMoveTargets}
        onOpenChange={(open) => !open && closeModal()}
        onSubmit={handleMove}
        open={modal.type === 'move'}
        targets={workspace.moveTargets}
      />
      <ShareWorkspaceItemModal
        collaborators={shareCollaborators}
        error={workspace.mutationError}
        isLoadingCollaborators={isLoadingShareCollaborators}
        isSubmitting={workspace.isSharing}
        item={modal.type === 'share' ? modal.item : null}
        onInvite={handleInvite}
        onOpenChange={(open) => !open && closeModal()}
        onRemoveCollaborator={handleRemoveCollaborator}
        onUpdateCollaborator={handleUpdateCollaborator}
        open={modal.type === 'share'}
      />
    </>
  );
}
