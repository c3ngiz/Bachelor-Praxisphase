import { AlertTriangle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';

import { Badge, type BadgeVariant } from '../../../shared/components';
import type { DivergenceStatus } from '../../collaboration/types/collaboration.types';

/** Props accepted by the divergence status badge. */
export interface DivergenceStatusBadgeProps {
  /** Current divergence lifecycle status. */
  divergence: DivergenceStatus;
}

/**
 * Displays the client/server text-hash comparison status.
 *
 * @param props - Badge props.
 * @returns Divergence status badge.
 */
export function DivergenceStatusBadge({
  divergence,
}: DivergenceStatusBadgeProps): JSX.Element {
  const Icon = getStatusIcon(divergence.state);

  return (
    <Badge className="gap-1.5" variant={getStatusVariant(divergence.state)}>
      <Icon
        aria-hidden="true"
        className={`h-3.5 w-3.5 ${divergence.state === 'checking' || divergence.state === 'resyncing' ? 'animate-spin' : ''}`}
      />
      {formatDivergenceState(divergence.state)}
    </Badge>
  );
}

/**
 * Selects a badge color variant for a divergence state.
 *
 * @param state - Divergence lifecycle state.
 * @returns Badge variant.
 */
function getStatusVariant(state: DivergenceStatus['state']): BadgeVariant {
  switch (state) {
    case 'divergence_detected':
    case 'error':
      return 'destructive';
    case 'checking':
    case 'resyncing':
      return 'warning';
    case 'in_sync':
      return 'success';
  }
}

/**
 * Selects an icon for a divergence state.
 *
 * @param state - Divergence lifecycle state.
 * @returns Lucide icon component.
 */
function getStatusIcon(state: DivergenceStatus['state']): typeof CheckCircle2 {
  switch (state) {
    case 'divergence_detected':
    case 'error':
      return AlertTriangle;
    case 'checking':
      return Loader2;
    case 'resyncing':
      return RefreshCw;
    case 'in_sync':
      return CheckCircle2;
  }
}

/**
 * Formats a divergence state for compact display.
 *
 * @param state - Divergence lifecycle state.
 * @returns Human-readable label.
 */
function formatDivergenceState(state: DivergenceStatus['state']): string {
  switch (state) {
    case 'divergence_detected':
      return 'Diverged';
    case 'checking':
      return 'Checking';
    case 'error':
      return 'Check error';
    case 'in_sync':
      return 'In sync';
    case 'resyncing':
      return 'Resyncing';
  }
}
