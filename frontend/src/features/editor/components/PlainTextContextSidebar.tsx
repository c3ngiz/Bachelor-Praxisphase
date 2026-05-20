import type { ReactNode } from 'react';
import {
  Activity,
  ChevronRight,
  FileText,
  RadioTower,
  Save,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';

import { Badge, Card, Divider } from '../../../shared/components';
import { getPermissionLabel } from '../../workspace/utils/workspaceFormatting';
import type {
  CursorState,
  PlainTextConnectionStatus,
  PlainTextEditorState,
} from '../types/editor.types';
import { getInitials } from '../utils/editorIdentity';
import { CollaborationMetricsPanel } from './CollaborationMetricsPanel';
import { DivergenceStatusBadge } from './DivergenceStatusBadge';
import { ResyncDocumentButton } from './ResyncDocumentButton';

export interface PlainTextContextSidebarProps {
  state: PlainTextEditorState;
}

export function PlainTextContextSidebar({ state }: PlainTextContextSidebarProps): JSX.Element {
  const accessLabel = state.document ? getPermissionLabel(state.document.permission) : 'Loading';
  const activePeopleCount = 1 + state.remoteCursors.length;

  return (
    <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
      <Card className="overflow-hidden">
        <Card.Content className="grid gap-4 p-4">
          <section aria-label="Document summary" className="grid gap-3">
            <div className="min-w-0">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Document
              </span>
              <h1 className="m-0 mt-1 truncate text-lg font-semibold text-slate-950">
                {state.title || 'Untitled document'}
              </h1>
              <p className="m-0 mt-1 truncate text-xs text-slate-500">
                {state.document?.owner.name ?? 'Workspace document'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <MetadataChip label="Access" value={accessLabel} />
              <MetadataChip label="Version" value={`v${state.version}`} />
            </div>

            <div className="grid gap-2 rounded-md bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <RadioTower aria-hidden="true" className="h-3.5 w-3.5" />
                  Connection
                </span>
                <StatusBadge status={state.status} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <Save aria-hidden="true" className="h-3.5 w-3.5" />
                  Save state
                </span>
                <Badge variant={getSaveStatusVariant(state.saveStatus)}>
                  {formatSaveStatus(state.saveStatus)}
                </Badge>
              </div>
            </div>
          </section>

          <Divider />

          <section aria-label="People" className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <PanelHeading icon={UsersRound} title="People" />
              <Badge variant="default">{activePeopleCount} active</Badge>
            </div>
            <div className="grid gap-2">
              <PersonRow cursor={state.localUser} detail="Current user" isCurrentUser />
              {state.remoteCursors.map((cursor) => (
                <PersonRow
                  cursor={cursor}
                  detail="Active collaborator"
                  key={`${cursor.user_id}:${cursor.client_id}`}
                />
              ))}
            </div>
            {state.remoteCursors.length === 0 ? (
              <p className="m-0 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-500">
                Only you are active in this document.
              </p>
            ) : null}
          </section>

          <CollapsibleSection icon={Activity} title="Metrics">
            <CollaborationMetricsPanel metrics={state.metrics} />
          </CollapsibleSection>

          <CollapsibleSection icon={FileText} title="Consistency">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">Hash status</span>
              <DivergenceStatusBadge divergence={state.divergence} />
            </div>
            {state.divergence.lastCheck ? (
              <SummaryRow label="Server hash" value={state.divergence.lastCheck.serverHash} />
            ) : null}
            {state.divergence.error ? (
              <p className="m-0 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
                {state.divergence.error}
              </p>
            ) : null}
            <ResyncDocumentButton
              divergence={state.divergence}
              onResync={state.resyncDocument}
            />
          </CollapsibleSection>

          <CollapsibleSection icon={FileText} title="Details">
            <SummaryRow label="Mode" value={formatSyncMode(state.syncMode)} />
            <SummaryRow label="Save" value={formatSaveStatus(state.saveStatus)} />
            <SummaryRow label="Client" value={state.clientId.slice(0, 8)} />
            <SummaryRow label="Permission" value={accessLabel} />
          </CollapsibleSection>
        </Card.Content>
      </Card>
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

interface MetadataChipProps {
  label: string;
  value: string;
}

function MetadataChip({ label, value }: MetadataChipProps): JSX.Element {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="max-w-[8rem] truncate font-medium text-slate-900">{value}</span>
    </span>
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
  isCurrentUser?: boolean;
}

function PersonRow({ cursor, detail, isCurrentUser = false }: PersonRowProps): JSX.Element {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-md px-1 py-1">
      <span
        aria-label={`${cursor.display_name} avatar`}
        className="relative h-8 w-8 shrink-0 rounded-full text-center text-xs font-semibold leading-8 text-white"
        role="img"
        style={{ backgroundColor: cursor.color }}
      >
        {getInitials(cursor.display_name)}
        <span
          aria-hidden="true"
          className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500"
        />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="m-0 truncate text-sm font-medium text-slate-950">{cursor.display_name}</p>
          {isCurrentUser ? <Badge variant="default">You</Badge> : null}
        </div>
        <p className="m-0 text-xs text-slate-500">{detail}</p>
      </div>
    </div>
  );
}

interface CollapsibleSectionProps {
  children: ReactNode;
  icon: LucideIcon;
  title: string;
}

function CollapsibleSection({ children, icon: Icon, title }: CollapsibleSectionProps): JSX.Element {
  return (
    <details className="group border-t border-slate-200 pt-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-md py-1 text-sm font-semibold text-slate-950 outline-none focus-visible:ring-2 focus-visible:ring-slate-400">
        <span className="flex items-center gap-2">
          <Icon aria-hidden="true" className="h-4 w-4 text-slate-500" />
          {title}
        </span>
        <ChevronRight
          aria-hidden="true"
          className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-90"
        />
      </summary>
      <div className="mt-3 grid gap-2">{children}</div>
    </details>
  );
}

function StatusBadge({ status }: { status: PlainTextConnectionStatus }): JSX.Element {
  const variant =
    status === 'connected' ? 'success' : status === 'error' ? 'destructive' : 'default';

  return (
    <Badge className="w-fit gap-1.5" variant={variant}>
      <RadioTower aria-hidden="true" className="h-3.5 w-3.5" />
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

function getSaveStatusVariant(
  status: PlainTextEditorState['saveStatus'],
): 'default' | 'success' | 'warning' | 'destructive' {
  switch (status) {
    case 'conflict':
    case 'error':
      return 'destructive';
    case 'saving':
    case 'unsaved':
      return 'warning';
    case 'live':
    case 'saved':
      return 'success';
    case 'idle':
      return 'default';
  }
}
