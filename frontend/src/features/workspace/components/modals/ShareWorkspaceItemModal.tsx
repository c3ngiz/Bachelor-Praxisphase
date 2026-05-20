import { useEffect, useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';

import { Badge, Button, Input, Modal, Select } from '../../../../shared/components';
import { getPermissionLabel } from '../../utils/workspaceFormatting';
import type { ApiError } from '../../../auth/types/auth.types';
import type { Collaborator, PermissionLevel, WorkspaceItem } from '../../types/workspace.types';

/** Props for the share item modal. */
export interface ShareWorkspaceItemModalProps {
  /** Item being shared. */
  item: WorkspaceItem | null;
  /** Fresh collaborator list for the item when available. */
  collaborators?: Collaborator[];
  /** Whether collaborators are being refreshed from the backend. */
  isLoadingCollaborators?: boolean;
  /** Whether the dialog is open. */
  open: boolean;
  /** Handles dialog open state changes. */
  onOpenChange: (open: boolean) => void;
  /** Shares the item with a new collaborator. */
  onInvite: (email: string, permission: Exclude<PermissionLevel, 'owner'>) => Promise<void>;
  /** Updates an existing collaborator permission. */
  onUpdateCollaborator: (
    collaboratorId: string,
    permission: Exclude<PermissionLevel, 'owner'>,
  ) => Promise<void>;
  /** Removes an existing collaborator. */
  onRemoveCollaborator: (collaboratorId: string) => Promise<void>;
  /** Whether a sharing operation is pending. */
  isSubmitting: boolean;
  /** Sharing error, when available. */
  error: ApiError | null;
}

const permissionOptions = [
  { label: 'Read', value: 'read' },
  { label: 'Write', value: 'write' },
];

/** Renders sharing controls and existing collaborator permissions. */
export function ShareWorkspaceItemModal({
  error,
  collaborators,
  isLoadingCollaborators = false,
  isSubmitting,
  item,
  onInvite,
  onOpenChange,
  onRemoveCollaborator,
  onUpdateCollaborator,
  open,
}: ShareWorkspaceItemModalProps): JSX.Element {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<Exclude<PermissionLevel, 'owner'>>('read');
  const visibleCollaborators = collaborators ?? item?.collaborators ?? [];

  useEffect(() => {
    if (open) {
      setEmail('');
      setPermission('read');
    }
  }, [open, item]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      return;
    }

    await onInvite(trimmedEmail, permission);
    setEmail('');
  }

  return (
    <Modal.Root open={open} onOpenChange={onOpenChange}>
      <Modal.Content className="max-w-2xl">
        <Modal.Header>
          <div>
            <Modal.Title>Share item</Modal.Title>
            <Modal.Description>
              Invite people to collaborate on {item?.name ?? 'this item'}.
            </Modal.Description>
          </div>
          <Modal.Close aria-label="Close">Close</Modal.Close>
        </Modal.Header>
        <Modal.Body className="grid gap-5">
          {error ? (
            <p
              className="m-0 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {error.message}
            </p>
          ) : null}
          <form className="grid gap-3 sm:grid-cols-[1fr_9rem_auto]" onSubmit={handleSubmit}>
            <Input
              label="Email address"
              name="share-email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="teammate@example.com"
              required
              type="email"
              value={email}
            />
            <Select
              label="Permission"
              name="share-permission"
              onChange={(event) =>
                setPermission(event.target.value as Exclude<PermissionLevel, 'owner'>)
              }
              options={permissionOptions}
              value={permission}
            />
            <div className="flex items-end">
              <Button className="w-full" loading={isSubmitting} type="submit">
                Invite
              </Button>
            </div>
          </form>

          <section aria-label="Existing collaborators" className="grid gap-2">
            <h3 className="m-0 text-sm font-semibold text-slate-950">Collaborators</h3>
            {visibleCollaborators.length ? (
              <div className="grid gap-2">
                {visibleCollaborators.map((collaborator) => (
                  <CollaboratorRow
                    collaborator={collaborator}
                    disabled={isSubmitting}
                    key={collaborator.id}
                    onRemove={onRemoveCollaborator}
                    onUpdate={onUpdateCollaborator}
                  />
                ))}
              </div>
            ) : isLoadingCollaborators ? (
              <p className="m-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                Loading collaborators...
              </p>
            ) : (
              <p className="m-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                No collaborators returned for this item.
              </p>
            )}
          </section>
        </Modal.Body>
        <Modal.Footer>
          <Modal.Close disabled={isSubmitting}>Done</Modal.Close>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
}

interface CollaboratorRowProps {
  /** Collaborator rendered in the row. */
  collaborator: Collaborator;
  /** Whether row controls are disabled. */
  disabled: boolean;
  /** Updates collaborator permission. */
  onUpdate: (
    collaboratorId: string,
    permission: Exclude<PermissionLevel, 'owner'>,
  ) => Promise<void>;
  /** Removes collaborator access. */
  onRemove: (collaboratorId: string) => Promise<void>;
}

/** Renders one collaborator permission row. */
function CollaboratorRow({
  collaborator,
  disabled,
  onRemove,
  onUpdate,
}: CollaboratorRowProps): JSX.Element {
  const isOwner = collaborator.permission === 'owner';

  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-[1fr_9rem_auto] sm:items-center">
      <div className="min-w-0">
        <p className="m-0 truncate text-sm font-medium text-slate-950">{collaborator.name}</p>
        {collaborator.email ? (
          <p className="m-0 truncate text-xs text-slate-500">{collaborator.email}</p>
        ) : null}
      </div>
      {isOwner ? (
        <Badge variant="success">{getPermissionLabel(collaborator.permission)}</Badge>
      ) : (
        <Select
          aria-label={`Permission for ${collaborator.name}`}
          disabled={disabled}
          name={`permission-${collaborator.id}`}
          onChange={(event) =>
            void onUpdate(collaborator.id, event.target.value as Exclude<PermissionLevel, 'owner'>)
          }
          options={permissionOptions}
          value={collaborator.permission}
        />
      )}
      <Button
        aria-label={`Remove ${collaborator.name}`}
        disabled={disabled || isOwner}
        iconOnly
        onClick={() => void onRemove(collaborator.id)}
        variant="ghost"
      >
        <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
      </Button>
    </div>
  );
}
