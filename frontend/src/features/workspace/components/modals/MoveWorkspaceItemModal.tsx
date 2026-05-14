import { useEffect, useState, type FormEvent } from 'react';

import { Button, Modal, Select } from '../../../../shared/components';
import type { ApiError } from '../../../auth/types/auth.types';
import type { EntityId, MoveTarget, WorkspaceItem } from '../../types/workspace.types';

/** Props for the move item modal. */
export interface MoveWorkspaceItemModalProps {
  /** Item being moved. */
  item: WorkspaceItem | null;
  /** Whether the dialog is open. */
  open: boolean;
  /** Handles dialog open state changes. */
  onOpenChange: (open: boolean) => void;
  /** Loads move destinations for the current item. */
  onLoadTargets: (itemId: EntityId) => Promise<MoveTarget[]>;
  /** Submits the selected destination. */
  onSubmit: (targetFolderId: EntityId | null) => Promise<void>;
  /** Available move targets. */
  targets: MoveTarget[];
  /** Whether move target loading is pending. */
  isLoadingTargets: boolean;
  /** Whether move is pending. */
  isSubmitting: boolean;
  /** Move error, when available. */
  error: ApiError | null;
}

/** Renders a move dialog with backend-provided folder destinations. */
export function MoveWorkspaceItemModal({
  error,
  isLoadingTargets,
  isSubmitting,
  item,
  onLoadTargets,
  onOpenChange,
  onSubmit,
  open,
  targets,
}: MoveWorkspaceItemModalProps): JSX.Element {
  const [selectedTargetId, setSelectedTargetId] = useState('');

  useEffect(() => {
    if (!open || !item) {
      return;
    }

    setSelectedTargetId('');
    void onLoadTargets(item.id).catch(() => {
      // The hook exposes the normalized error to this modal.
    });
  }, [item, onLoadTargets, open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const target = targets.find((moveTarget) => targetValue(moveTarget.id) === selectedTargetId);

    if (!target || !target.canMoveHere) {
      return;
    }

    await onSubmit(target.id);
    onOpenChange(false);
  }

  return (
    <Modal.Root open={open} onOpenChange={onOpenChange}>
      <Modal.Content>
        <form onSubmit={handleSubmit}>
          <Modal.Header>
            <div>
              <Modal.Title>Move item</Modal.Title>
              <Modal.Description>
                Choose a folder destination for {item?.name ?? 'this item'}.
              </Modal.Description>
            </div>
            <Modal.Close aria-label="Close">Close</Modal.Close>
          </Modal.Header>
          <Modal.Body className="grid gap-4">
            {error ? (
              <p
                className="m-0 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                role="alert"
              >
                {error.message}
              </p>
            ) : null}
            <Select
              disabled={isLoadingTargets}
              label="Destination"
              name="workspace-move-target"
              onChange={(event) => setSelectedTargetId(event.target.value)}
              options={targets.map((target) => ({
                disabled: !target.canMoveHere,
                label: target.path,
                value: targetValue(target.id),
              }))}
              placeholder={isLoadingTargets ? 'Loading folders...' : 'Select a destination'}
              required
              value={selectedTargetId}
            />
          </Modal.Body>
          <Modal.Footer>
            <Modal.Close disabled={isSubmitting}>Cancel</Modal.Close>
            <Button disabled={!selectedTargetId} loading={isSubmitting} type="submit">
              Move
            </Button>
          </Modal.Footer>
        </form>
      </Modal.Content>
    </Modal.Root>
  );
}

/**
 * Converts nullable target identifiers into select option values.
 *
 * @param id - Move target identifier.
 * @returns Stable select value.
 */
function targetValue(id: EntityId | null): string {
  return id ?? '__workspace-root__';
}
