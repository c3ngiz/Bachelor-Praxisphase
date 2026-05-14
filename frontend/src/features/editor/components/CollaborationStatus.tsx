import { Badge } from '../../../shared/components';
import { formatActiveCollaborators } from '../utils/editorFormatting';
import type {
  EditorAwarenessUser,
  EditorCollaborationStatus,
} from '../types/editor.types';

/** Props for the collaboration status component. */
export interface CollaborationStatusProps {
  /** Current collaboration transport status. */
  status: EditorCollaborationStatus;
  /** Active remote collaborators. */
  users: EditorAwarenessUser[];
  /** Whether the current user is read-only. */
  readOnly: boolean;
}

/** Renders collaboration transport and presence state. */
export function CollaborationStatus({
  readOnly,
  status,
  users,
}: CollaborationStatusProps): JSX.Element {
  const variant = status === 'failed' ? 'destructive' : status === 'synced' ? 'success' : 'default';

  return (
    <div className="flex min-w-0 items-center gap-2 text-xs text-slate-600">
      <Badge variant={variant}>{getStatusLabel(status)}</Badge>
      {readOnly ? <Badge variant="warning">Read only</Badge> : null}
      <span className="truncate" aria-live="polite">
        {formatActiveCollaborators(users)}
      </span>
    </div>
  );
}

/**
 * Formats a collaboration status for display.
 *
 * @param status - Collaboration status.
 * @returns Human-readable label.
 */
function getStatusLabel(status: EditorCollaborationStatus): string {
  if (status === 'synced') {
    return 'Live';
  }

  if (status === 'connected') {
    return 'Connected';
  }

  if (status === 'connecting') {
    return 'Connecting';
  }

  if (status === 'failed') {
    return 'Offline';
  }

  if (status === 'disconnected') {
    return 'Disconnected';
  }

  return 'Idle';
}
