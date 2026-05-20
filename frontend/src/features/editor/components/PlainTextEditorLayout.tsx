import { Badge, Button } from '../../../shared/components';
import type { PlainTextEditorState } from '../types/editor.types';
import { PlainTextContextSidebar } from './PlainTextContextSidebar';
import { PlainTextEditorSurface } from './PlainTextEditorSurface';

export interface PlainTextEditorLayoutProps {
  state: PlainTextEditorState;
}

export function PlainTextEditorLayout({ state }: PlainTextEditorLayoutProps): JSX.Element {
  return (
    <section aria-label="Plain text collaborative editor" className="plaintext-editor-page">
      <PlainTextContextSidebar state={state} />

      <main className="plaintext-editor-main">
        {state.error ? (
          <div className="plaintext-error" role="alert">
            {state.error}
          </div>
        ) : null}
        <div className="plaintext-editor-toolbar">
          <div>
            <p className="m-0 text-sm font-semibold text-slate-950">Collaborative plain text</p>
            <p className="m-0 text-xs text-slate-500">
              {formatSyncMode(state.syncMode)} at document version {state.version}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={state.canWrite ? 'success' : 'default'}>
              {state.canWrite ? 'Editable' : 'Read only'}
            </Badge>
            <Badge variant={state.saveStatus === 'conflict' ? 'destructive' : 'default'}>
              {formatSaveStatus(state.saveStatus)}
            </Badge>
            {state.syncMode !== 'websocket' ? (
              <Button
                disabled={!state.canWrite || Boolean(state.conflict)}
                loading={state.saveStatus === 'saving'}
                onClick={() => void state.saveNow()}
                size="sm"
                variant="secondary"
              >
                Save
              </Button>
            ) : null}
          </div>
        </div>
        {state.conflict ? (
          <div className="plaintext-error" role="alert">
            Remote revision {state.conflict.remoteRevision} is available. Reload or reopen the
            document before saving local edits.
          </div>
        ) : null}
        <PlainTextEditorSurface state={state} />
      </main>
    </section>
  );
}

/**
 * Formats the active editor sync mode for compact status text.
 *
 * @param syncMode - Active editor synchronization mode.
 * @returns Human-readable sync mode label.
 */
function formatSyncMode(syncMode: PlainTextEditorState['syncMode']): string {
  switch (syncMode) {
    case 'polling':
      return 'Polling sync';
    case 'subscription':
      return 'GraphQL subscription sync';
    case 'websocket':
      return 'WebSocket OT transport';
  }
}

/**
 * Formats the current save state for the editor toolbar.
 *
 * @param status - Current save status.
 * @returns Human-readable save status label.
 */
function formatSaveStatus(status: PlainTextEditorState['saveStatus']): string {
  switch (status) {
    case 'conflict':
      return 'Conflict';
    case 'error':
      return 'Save error';
    case 'idle':
      return 'Idle';
    case 'live':
      return 'Live';
    case 'saved':
      return 'Saved';
    case 'saving':
      return 'Saving';
    case 'unsaved':
      return 'Unsaved';
  }
}
