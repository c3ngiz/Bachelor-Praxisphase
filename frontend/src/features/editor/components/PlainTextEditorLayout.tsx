import type { ReactNode } from 'react';
import { AlertTriangle, Clock3, LockKeyhole, PencilLine, RadioTower } from 'lucide-react';

import { Badge, Button, Card } from '../../../shared/components';
import type { PlainTextEditorState } from '../types/editor.types';
import { PlainTextContextSidebar } from './PlainTextContextSidebar';
import { PlainTextEditorSurface } from './PlainTextEditorSurface';

export interface PlainTextEditorLayoutProps {
  state: PlainTextEditorState;
}

export function PlainTextEditorLayout({ state }: PlainTextEditorLayoutProps): JSX.Element {
  return (
    <section
      aria-label="Plain text collaborative editor"
      className="grid min-h-[calc(100vh-7rem)] grid-cols-1 gap-4 lg:grid-cols-[minmax(17.5rem,19rem)_minmax(0,1fr)] xl:gap-5"
    >
      <PlainTextContextSidebar state={state} />

      <main className="min-w-0">
        <Card className="flex min-h-[60vh] min-w-0 flex-col overflow-hidden lg:min-h-[calc(100vh-7rem)]">
          <EditorHeader state={state} />
          <EditorNotice state={state} />
          <div className="min-h-0 flex-1 bg-white">
            <PlainTextEditorSurface
              canWrite={state.canWrite}
              content={state.content}
              contentSerial={state.contentSerial}
              markRemoteApplied={state.markRemoteApplied}
              remoteCursors={state.remoteCursors}
              remoteOperation={state.remoteOperation}
              sendCursor={state.sendCursor}
              sendLocalOperation={state.sendLocalOperation}
            />
          </div>
        </Card>
      </main>
    </section>
  );
}

function EditorHeader({ state }: PlainTextEditorLayoutProps): JSX.Element {
  const title = state.title || 'Untitled document';

  return (
    <Card.Header className="flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
      <div className="min-w-0">
        <p className="m-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Collaborative plain text
        </p>
        <h2 className="m-0 mt-1 truncate text-xl font-semibold text-slate-950">{title}</h2>
        <p className="m-0 mt-1 text-sm text-slate-500">
          Version {state.version} / {formatSyncMode(state.syncMode)}
        </p>
      </div>

      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
        <Badge className="gap-1.5" variant={state.canWrite ? 'success' : 'warning'}>
          {state.canWrite ? (
            <PencilLine aria-hidden="true" className="h-3.5 w-3.5" />
          ) : (
            <LockKeyhole aria-hidden="true" className="h-3.5 w-3.5" />
          )}
          {state.canWrite ? 'Editable' : 'Read-only'}
        </Badge>
        <ConnectionBadge status={state.status} />
        <SaveStatusBadge status={state.saveStatus} />
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
    </Card.Header>
  );
}

function EditorNotice({ state }: PlainTextEditorLayoutProps): JSX.Element | null {
  if (state.error) {
    return (
      <Notice tone="error">
        <AlertTriangle aria-hidden="true" className="h-4 w-4 shrink-0" />
        {state.error}
      </Notice>
    );
  }

  if (state.conflict) {
    return (
      <Notice tone="error">
        <AlertTriangle aria-hidden="true" className="h-4 w-4 shrink-0" />
        Remote revision {state.conflict.remoteRevision} is available. Reload or reopen the document
        before saving local edits.
      </Notice>
    );
  }

  if (state.isLoading) {
    return (
      <Notice tone="info">
        <Clock3 aria-hidden="true" className="h-4 w-4 shrink-0" />
        Loading the latest document snapshot.
      </Notice>
    );
  }

  if (state.status === 'connecting') {
    return (
      <Notice tone="info">
        <RadioTower aria-hidden="true" className="h-4 w-4 shrink-0" />
        Connecting the collaboration session.
      </Notice>
    );
  }

  if (state.status === 'disconnected') {
    return (
      <Notice tone="warning">
        <RadioTower aria-hidden="true" className="h-4 w-4 shrink-0" />
        Collaboration is disconnected. Editing will resume when the transport reconnects.
      </Notice>
    );
  }

  if (!state.canWrite) {
    return (
      <Notice tone="info">
        <LockKeyhole aria-hidden="true" className="h-4 w-4 shrink-0" />
        You can view live updates, but this document is read-only for your account.
      </Notice>
    );
  }

  return null;
}

interface NoticeProps {
  children: ReactNode;
  tone: 'error' | 'info' | 'warning';
}

function Notice({ children, tone }: NoticeProps): JSX.Element {
  const className =
    tone === 'error'
      ? 'border-red-200 bg-red-50 text-red-800'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-900'
        : 'border-sky-200 bg-sky-50 text-sky-900';

  return (
    <div
      className={`flex items-start gap-2 border-b px-4 py-3 text-sm sm:px-5 ${className}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {children}
    </div>
  );
}

function ConnectionBadge({ status }: { status: PlainTextEditorState['status'] }): JSX.Element {
  const variant =
    status === 'connected' ? 'success' : status === 'error' ? 'destructive' : 'warning';

  return (
    <Badge className="gap-1.5" variant={variant}>
      <RadioTower aria-hidden="true" className="h-3.5 w-3.5" />
      {formatConnectionStatus(status)}
    </Badge>
  );
}

function SaveStatusBadge({ status }: { status: PlainTextEditorState['saveStatus'] }): JSX.Element {
  const variant =
    status === 'conflict' || status === 'error'
      ? 'destructive'
      : status === 'saving' || status === 'unsaved'
        ? 'warning'
        : status === 'live' || status === 'saved'
          ? 'success'
          : 'default';

  return <Badge variant={variant}>{formatSaveStatus(status)}</Badge>;
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

function formatConnectionStatus(status: PlainTextEditorState['status']): string {
  switch (status) {
    case 'loading':
      return 'Loading';
    case 'connecting':
      return 'Connecting';
    case 'connected':
      return 'Connected';
    case 'disconnected':
      return 'Offline';
    case 'error':
      return 'Connection error';
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
      return 'Live sync';
    case 'saved':
      return 'Saved';
    case 'saving':
      return 'Saving';
    case 'unsaved':
      return 'Unsaved changes';
  }
}
