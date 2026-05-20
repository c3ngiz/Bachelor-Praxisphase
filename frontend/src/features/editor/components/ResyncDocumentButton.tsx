import { RefreshCw } from 'lucide-react';

import { Button } from '../../../shared/components';
import type { DivergenceStatus } from '../../collaboration/types/collaboration.types';

/** Props accepted by the resync document button. */
export interface ResyncDocumentButtonProps {
  /** Current divergence status. */
  divergence: DivergenceStatus;
  /** Command that reloads the latest server snapshot. */
  onResync: () => Promise<void>;
}

/**
 * Safe resync action shown when divergence is detected or a hash check fails.
 *
 * @param props - Button props.
 * @returns Resync action button.
 */
export function ResyncDocumentButton({
  divergence,
  onResync,
}: ResyncDocumentButtonProps): JSX.Element | null {
  const shouldShow =
    divergence.state === 'divergence_detected' ||
    divergence.state === 'error' ||
    divergence.state === 'resyncing';

  if (!shouldShow) {
    return null;
  }

  return (
    <Button
      className="w-full"
      loading={divergence.state === 'resyncing'}
      onClick={() => void onResync()}
      size="sm"
      variant="secondary"
    >
      <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
      Resync
    </Button>
  );
}
