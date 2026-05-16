import { AlertTriangle, DownloadCloud, ShieldCheck } from 'lucide-react';

import { Button } from '../../../shared/components';
import type { EditorSyncConflict } from '../types/editor.types';

/** Props for the polling conflict notice. */
export interface ConflictNoticeProps {
  /** Active remote-update conflict. */
  conflict: EditorSyncConflict;
  /** Keeps local edits and adopts the latest backend revision before saving. */
  onKeepLocalVersion: () => void;
  /** Reloads and applies the latest backend content snapshot. */
  onReloadLatest: () => void;
}

/**
 * Shows the safe actions available when polling finds newer remote content.
 *
 * @param props - Conflict notice props.
 * @returns Conflict warning with explicit resolution buttons.
 */
export function ConflictNotice({
  conflict,
  onKeepLocalVersion,
  onReloadLatest,
}: ConflictNoticeProps): JSX.Element {
  return (
    <div
      className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900"
      role="status"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0">
          <p className="m-0 text-sm font-semibold">Remote changes available</p>
          <p className="m-0 mt-1 text-xs leading-5 text-amber-800">
            Revision {conflict.remoteVersion.revision} was saved while your local editor has unsaved
            changes. Your content was not overwritten.
          </p>
        </div>
      </div>
      <div className="mt-3 grid gap-2">
        <Button
          className="justify-center gap-2"
          onClick={onReloadLatest}
          size="sm"
          variant="secondary"
        >
          <DownloadCloud aria-hidden="true" className="h-4 w-4" />
          Reload latest
        </Button>
        <Button
          className="justify-center gap-2"
          onClick={onKeepLocalVersion}
          size="sm"
          variant="primary"
        >
          <ShieldCheck aria-hidden="true" className="h-4 w-4" />
          Keep my version
        </Button>
      </div>
    </div>
  );
}
