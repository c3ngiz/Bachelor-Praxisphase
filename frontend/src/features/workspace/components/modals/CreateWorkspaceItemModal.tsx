import { useEffect, useState, type FormEvent } from 'react';

import { Button, Input, Modal } from '../../../../shared/components';
import type { ApiError } from '../../../auth/types/auth.types';
import type { WorkspaceItemKind } from '../../types/workspace.types';

/** Props for the create document/folder modal. */
export interface CreateWorkspaceItemModalProps {
  /** Whether the dialog is open. */
  open: boolean;
  /** Item kind being created. */
  kind: WorkspaceItemKind;
  /** Handles dialog open state changes. */
  onOpenChange: (open: boolean) => void;
  /** Submits the new item name. */
  onSubmit: (name: string) => Promise<void>;
  /** Whether creation is pending. */
  isSubmitting: boolean;
  /** Creation error, when available. */
  error: ApiError | null;
}

/** Renders the create folder/document dialog. */
export function CreateWorkspaceItemModal({
  error,
  isSubmitting,
  kind,
  onOpenChange,
  onSubmit,
  open,
}: CreateWorkspaceItemModalProps): JSX.Element {
  const [name, setName] = useState('');
  const label = kind === 'folder' ? 'Folder' : 'Document';

  useEffect(() => {
    if (open) {
      setName('');
    }
  }, [open, kind]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
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
              <Modal.Title>Create {label.toLowerCase()}</Modal.Title>
              <Modal.Description>Name the {label.toLowerCase()} for this folder.</Modal.Description>
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
              label={`${label} name`}
              name="workspace-item-name"
              onChange={(event) => setName(event.target.value)}
              placeholder={kind === 'folder' ? 'Project notes' : 'Untitled document'}
              required
              value={name}
            />
          </Modal.Body>
          <Modal.Footer>
            <Modal.Close disabled={isSubmitting}>Cancel</Modal.Close>
            <Button loading={isSubmitting} type="submit">
              Create
            </Button>
          </Modal.Footer>
        </form>
      </Modal.Content>
    </Modal.Root>
  );
}
