import { AlertTriangle } from 'lucide-react';

import { Button, Modal } from '../../../../shared/components';
import type { ApiError } from '../../../auth/types/auth.types';
import type { WorkspaceItem } from '../../types/workspace.types';

/** Props for the delete confirmation modal. */
export interface DeleteWorkspaceItemModalProps {
  /** Item being deleted. */
  item: WorkspaceItem | null;
  /** Whether the dialog is open. */
  open: boolean;
  /** Handles dialog open state changes. */
  onOpenChange: (open: boolean) => void;
  /** Confirms deletion. */
  onConfirm: () => Promise<void>;
  /** Whether deletion is pending. */
  isSubmitting: boolean;
  /** Delete error, when available. */
  error: ApiError | null;
}

/** Renders a destructive confirmation dialog before deleting an item. */
export function DeleteWorkspaceItemModal({
  error,
  isSubmitting,
  item,
  onConfirm,
  onOpenChange,
  open,
}: DeleteWorkspaceItemModalProps): JSX.Element {
  async function handleConfirm(): Promise<void> {
    if (!item) {
      return;
    }

    await onConfirm();
    onOpenChange(false);
  }

  return (
    <Modal.Root open={open} onOpenChange={onOpenChange}>
      <Modal.Content>
        <Modal.Header>
          <div>
            <Modal.Title>Delete {item?.kind ?? 'item'}</Modal.Title>
            <Modal.Description>This action removes the item from the workspace.</Modal.Description>
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
          <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p className="m-0 text-sm leading-6">
              Delete <span className="font-semibold">{item?.name ?? 'this item'}</span>? This cannot
              be undone from the workspace UI.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Modal.Close disabled={isSubmitting}>Cancel</Modal.Close>
          <Button loading={isSubmitting} onClick={handleConfirm} variant="destructive">
            Delete
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
}
