import { Activity, FileText, RadioTower, UsersRound, type LucideIcon } from 'lucide-react';

import { Badge, Divider } from '../../../shared/components';
import { getPermissionLabel } from '../../workspace/utils/workspaceFormatting';
import type {
  CursorState,
  PlainTextConnectionStatus,
  PlainTextEditorState,
  PlainTextMetrics,
} from '../types/editor.types';
import { getInitials } from '../utils/editorIdentity';

export interface PlainTextContextSidebarProps {
  state: PlainTextEditorState;
}

export function PlainTextContextSidebar({ state }: PlainTextContextSidebarProps): JSX.Element {
  return (
    <aside className="plaintext-context-panel">
      <section aria-label="Document summary" className="grid gap-3">
        <div className="grid gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Filename
          </span>
          <h1 className="m-0 truncate text-base font-semibold text-slate-950">
            {state.title || 'Untitled document'}
          </h1>
        </div>
        <SummaryRow
          label="Access"
          value={state.document ? getPermissionLabel(state.document.permission) : 'Loading'}
        />
        <SummaryRow label="Version" value={`v${state.version}`} />
        <StatusBadge status={state.status} />
      </section>

      <Divider />

      <section aria-label="People" className="grid gap-3">
        <PanelHeading icon={UsersRound} title="People" />
        <PersonRow cursor={state.localUser} detail="Current user" />
        {state.remoteCursors.length > 0 ? (
          <div className="grid gap-2">
            {state.remoteCursors.map((cursor) => (
              <PersonRow
                cursor={cursor}
                detail="Active collaborator"
                key={`${cursor.user_id}:${cursor.client_id}`}
              />
            ))}
          </div>
        ) : (
          <p className="m-0 text-xs text-slate-500">No active collaborators detected.</p>
        )}
      </section>

      <Divider />

      <section aria-label="Metrics" className="grid gap-3">
        <PanelHeading icon={Activity} title="Metrics" />
        <MetricsRows metrics={state.metrics} />
      </section>

      <Divider />

      <section aria-label="Document details" className="grid gap-3">
        <PanelHeading icon={FileText} title="Details" />
        <SummaryRow label="Mode" value={formatSyncMode(state.syncMode)} />
        <SummaryRow label="Save" value={formatSaveStatus(state.saveStatus)} />
        <SummaryRow label="Client" value={state.clientId.slice(0, 8)} />
      </section>
    </aside>
  );
}

interface PanelHeadingProps {
  icon: LucideIcon;
  title: string;
}

function PanelHeading({ icon: Icon, title }: PanelHeadingProps): JSX.Element {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
      <Icon aria-hidden="true" className="h-4 w-4 text-slate-500" />
      {title}
    </div>
  );
}

interface SummaryRowProps {
  label: string;
  value: string;
}

function SummaryRow({ label, value }: SummaryRowProps): JSX.Element {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="min-w-0 truncate text-right font-medium text-slate-800">{value}</span>
    </div>
  );
}

interface PersonRowProps {
  cursor: CursorState;
  detail: string;
}

function PersonRow({ cursor, detail }: PersonRowProps): JSX.Element {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        aria-hidden="true"
        className="h-8 w-8 shrink-0 rounded-full text-center text-xs font-semibold leading-8 text-white"
        style={{ backgroundColor: cursor.color }}
      >
        {getInitials(cursor.display_name)}
      </span>
      <div className="min-w-0">
        <p className="m-0 truncate text-sm font-medium text-slate-950">{cursor.display_name}</p>
        <p className="m-0 text-xs text-slate-500">{detail}</p>
      </div>
    </div>
  );
}

function MetricsRows({ metrics }: { metrics: PlainTextMetrics }): JSX.Element {
  return (
    <div className="grid gap-2">
      <SummaryRow label="Sent" value={String(metrics.sentOps)} />
      <SummaryRow label="Acked" value={String(metrics.ackedOps)} />
      <SummaryRow label="Remote ops" value={String(metrics.receivedRemoteOps)} />
      <SummaryRow label="Transforms" value={String(metrics.transformedOps)} />
      <SummaryRow
        label="Last ack"
        value={metrics.lastAckLatencyMs === null ? '-' : `${metrics.lastAckLatencyMs.toFixed(1)} ms`}
      />
      <SummaryRow
        label="Avg ack"
        value={metrics.avgAckLatencyMs === null ? '-' : `${metrics.avgAckLatencyMs.toFixed(1)} ms`}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: PlainTextConnectionStatus }): JSX.Element {
  const variant =
    status === 'connected' ? 'success' : status === 'error' ? 'destructive' : 'default';

  return (
    <Badge className="w-fit" variant={variant}>
      <RadioTower aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
      {formatStatus(status)}
    </Badge>
  );
}

function formatStatus(status: PlainTextConnectionStatus): string {
  switch (status) {
    case 'loading':
      return 'Loading';
    case 'connecting':
      return 'Connecting';
    case 'connected':
      return 'Connected';
    case 'disconnected':
      return 'Disconnected';
    case 'error':
      return 'Error';
  }
}

/**
 * Formats the active synchronization mode for the details panel.
 *
 * @param syncMode - Active editor synchronization mode.
 * @returns Human-readable mode label.
 */
function formatSyncMode(syncMode: PlainTextEditorState['syncMode']): string {
  switch (syncMode) {
    case 'polling':
      return 'Polling';
    case 'subscription':
      return 'GraphQL subscription';
    case 'websocket':
      return 'WebSocket OT';
  }
}

/**
 * Formats the save state for the details panel.
 *
 * @param status - Current save status.
 * @returns Human-readable save status label.
 */
function formatSaveStatus(status: PlainTextEditorState['saveStatus']): string {
  switch (status) {
    case 'conflict':
      return 'Conflict';
    case 'error':
      return 'Error';
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
