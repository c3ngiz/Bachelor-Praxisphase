import { useEffect, useState, type FormEvent } from 'react';

import { Button, Input, Modal } from '../../../../shared/components';
import type { ApiError } from '../../../auth/types/auth.types';
import type { WorkspaceItem } from '../../types/workspace.types';

/** Props for the rename item modal. */
export interface RenameWorkspaceItemModalProps {
  /** Item being renamed. */
  item: WorkspaceItem | null;
  /** Whether the dialog is open. */
  open: boolean;
  /** Handles dialog open state changes. */
  onOpenChange: (open: boolean) => void;
  /** Submits the replacement name. */
  onSubmit: (name: string) => Promise<void>;
  /** Whether rename is pending. */
  isSubmitting: boolean;
  /** Rename error, when available. */
  error: ApiError | null;
}

/** Renders a rename dialog for documents and folders. */
export function RenameWorkspaceItemModal({
  error,
  isSubmitting,
  item,
  onOpenChange,
  onSubmit,
  open,
}: RenameWorkspaceItemModalProps): JSX.Element {
  const [name, setName] = useState('');

  useEffect(() => {
    if (open) {
      setName(item?.name ?? '');
    }
  }, [item, open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!item || !trimmedName) {
      return;
    }

    await onSubmit(trimmedName);
    onOpenChange(false);
  }

  return (
    <Modal.Root open={open} onOpenChange={onOpenChange}>
      <Modal.Content>
        <form onSubmit={handleSubmit}>
          <Modal.Header>
            <div>
              <Modal.Title>Rename item</Modal.Title>
              <Modal.Description>Change the name shown in your workspace.</Modal.Description>
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
            <Input
              autoFocus
              label="Name"
              name="workspace-rename"
              onChange={(event) => setName(event.target.value)}
              required
              value={name}
            />
          </Modal.Body>
          <Modal.Footer>
            <Modal.Close disabled={isSubmitting}>Cancel</Modal.Close>
            <Button loading={isSubmitting} type="submit">
              Save
            </Button>
          </Modal.Footer>
        </form>
      </Modal.Content>
    </Modal.Root>
  );
}
