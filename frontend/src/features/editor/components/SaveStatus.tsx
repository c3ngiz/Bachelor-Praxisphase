import { Badge } from '../../../shared/components';
import type { EditorSaveStatus } from '../types/editor.types';

/** Props for the save status component. */
export interface SaveStatusProps {
  /** Current save state. */
  status: EditorSaveStatus;
  /** Optional save failure message. */
  error?: string | null;
}

/** Renders autosave state near the document title. */
export function SaveStatus({ error, status }: SaveStatusProps): JSX.Element {
  const variant =
    status === 'failed'
      ? 'destructive'
      : status === 'saved'
        ? 'success'
        : status === 'saving'
          ? 'warning'
          : 'default';

  return (
    <div className="flex min-w-0 items-center gap-2">
      <Badge variant={variant}>{getSaveStatusLabel(status)}</Badge>
      {error ? <span className="truncate text-xs text-red-600">{error}</span> : null}
    </div>
  );
}

/**
 * Formats a save state for display.
 *
 * @param status - Save status.
 * @returns Human-readable label.
 */
function getSaveStatusLabel(status: EditorSaveStatus): string {
  if (status === 'saving') {
    return 'Saving';
  }

  if (status === 'unsaved') {
    return 'Unsaved';
  }

  if (status === 'failed') {
    return 'Save failed';
  }

  return 'Saved';
}
