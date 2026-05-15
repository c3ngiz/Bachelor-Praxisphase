import { RadioTower, UsersRound } from 'lucide-react';

import { Badge } from '../../../shared/components';
import type { UseCollaborationResult } from '../types/editor.types';

/** Props for collaboration status rendering. */
export interface CollaborationStatusBadgeProps {
  /** Collaboration adapter state. */
  collaboration: UseCollaborationResult;
}

/**
 * Shows the current collaboration transport and awareness state.
 *
 * @param props - Collaboration status badge props.
 * @returns Collaboration status badge.
 */
export function CollaborationStatusBadge({
  collaboration,
}: CollaborationStatusBadgeProps): JSX.Element {
  if (!collaboration.isRealtimeEnabled) {
    return (
      <Badge className="w-fit" title={collaboration.roomName} variant="default">
        <RadioTower aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
        Polling
      </Badge>
    );
  }

  const variant = collaboration.status === 'error' ? 'destructive' : 'success';

  return (
    <Badge className="w-fit" title={collaboration.roomName} variant={variant}>
      <UsersRound aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
      {collaboration.users.length + 1} online
    </Badge>
  );
}
