import { AlertTriangle, CheckCircle2, Clock3, CloudOff, Loader2, PauseCircle } from 'lucide-react';

import { Badge } from '../../../shared/components';
import type { DocumentSyncStatus } from '../types/editor.types';

/** Props for the polling synchronization status badge. */
export interface SyncStatusBadgeProps {
  /** Current polling synchronization status. */
  status: DocumentSyncStatus;
}

/**
 * Renders a compact polling synchronization state.
 *
 * @param props - Sync badge props.
 * @returns Accessible synchronization status badge.
 */
export function SyncStatusBadge({ status }: SyncStatusBadgeProps): JSX.Element {
  const Icon = getSyncStatusIcon(status);
  const label = getSyncStatusLabel(status);
  const variant =
    status === 'error'
      ? 'destructive'
      : status === 'conflict'
        ? 'warning'
        : status === 'idle' || status === 'paused'
          ? 'default'
          : 'success';

  return (
    <Badge aria-live="polite" className="w-fit" variant={variant}>
      <Icon
        aria-hidden="true"
        className={status === 'checking' ? 'mr-1.5 h-3.5 w-3.5 animate-spin' : 'mr-1.5 h-3.5 w-3.5'}
      />
      {label}
    </Badge>
  );
}

/**
 * Maps a sync state to a short display label.
 *
 * @param status - Polling synchronization status.
 * @returns Human-readable label.
 */
function getSyncStatusLabel(status: DocumentSyncStatus): string {
  if (status === 'checking') {
    return 'Checking';
  }

  if (status === 'remote-applied') {
    return 'Updated';
  }

  if (status === 'conflict') {
    return 'Sync conflict';
  }

  if (status === 'error') {
    return 'Sync error';
  }

  if (status === 'paused') {
    return 'Polling paused';
  }

  if (status === 'idle') {
    return 'Polling inactive';
  }

  return 'Polling active';
}

/**
 * Maps a sync state to a lucide icon.
 *
 * @param status - Polling synchronization status.
 * @returns Icon component.
 */
function getSyncStatusIcon(status: DocumentSyncStatus): typeof CheckCircle2 {
  if (status === 'checking') {
    return Loader2;
  }

  if (status === 'conflict') {
    return AlertTriangle;
  }

  if (status === 'error') {
    return CloudOff;
  }

  if (status === 'paused') {
    return PauseCircle;
  }

  if (status === 'idle') {
    return Clock3;
  }

  return CheckCircle2;
}
