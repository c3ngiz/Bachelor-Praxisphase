import { CheckCircle2, CloudOff, Loader2, PencilLine } from 'lucide-react';

import { Badge } from '../../../shared/components';
import type { DocumentSaveState } from '../types/editor.types';

/** Props for the save status badge. */
export interface SaveStatusBadgeProps {
  /** ISO timestamp of the last successful save. */
  lastSavedAt: string | null;
  /** Current save state. */
  state: DocumentSaveState;
}

/**
 * Shows the current document save state.
 *
 * @param props - Save status badge props.
 * @returns Accessible save status badge.
 */
export function SaveStatusBadge({
  lastSavedAt,
  state,
}: SaveStatusBadgeProps): JSX.Element {
  const Icon =
    state === 'saving'
      ? Loader2
      : state === 'failed'
        ? CloudOff
        : state === 'unsaved'
          ? PencilLine
          : CheckCircle2;
  const label =
    state === 'saving'
      ? 'Saving'
      : state === 'failed'
        ? 'Save failed'
        : state === 'unsaved'
          ? 'Unsaved changes'
          : 'Saved';
  const variant = state === 'failed' ? 'destructive' : state === 'unsaved' ? 'warning' : 'success';

  return (
    <Badge aria-live="polite" className="w-fit" variant={variant}>
      <Icon
        aria-hidden="true"
        className={state === 'saving' ? 'mr-1.5 h-3.5 w-3.5 animate-spin' : 'mr-1.5 h-3.5 w-3.5'}
      />
      {label}
      {state === 'saved' && lastSavedAt ? (
        <span className="ml-1 opacity-70">{new Date(lastSavedAt).toLocaleTimeString()}</span>
      ) : null}
    </Badge>
  );
}
