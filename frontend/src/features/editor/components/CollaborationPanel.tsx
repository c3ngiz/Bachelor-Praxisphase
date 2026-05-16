import type { CSSProperties } from 'react';
import { FileText, type LucideIcon, UsersRound } from 'lucide-react';

import { Avatar, Divider } from '../../../shared/components';
import { getPermissionLabel } from '../../workspace/utils/workspaceFormatting';
import { ConflictNotice } from './ConflictNotice';
import { SaveStatusBadge } from './SaveStatusBadge';
import { SyncStatusBadge } from './SyncStatusBadge';
import type { CollaborationUser, UseDocumentEditorResult } from '../types/editor.types';

/** Props for the editor collaboration panel. */
export interface CollaborationPanelProps {
  /** Editor state returned by `useDocumentEditor`. */
  state: UseDocumentEditorResult;
}

/**
 * Renders compact document context and polling collaboration state.
 *
 * The panel keeps always-needed context visible on the left rail: document
 * title, owner, permission, save/sync state, people, and a small details set.
 * Realtime presence is shown only when the provider supplies it; polling mode
 * gets a short unavailable note rather than fabricated active users.
 *
 * @param props - Collaboration panel props.
 * @returns Collaboration and document information panel.
 */
export function CollaborationPanel({ state }: CollaborationPanelProps): JSX.Element {
  const document = state.document;
  const owner = document?.owner;
  const localUser = state.collaboration.localUser;
  const lastSyncedAt = state.sync.lastSyncedAt ?? state.sync.lastCheckedAt;

  return (
    <div className="grid gap-4">
      <section aria-label="Document summary" className="grid gap-3">
        <div className="grid gap-1.5">
          <label
            className="m-0 text-xs font-semibold uppercase tracking-wide text-slate-500"
            htmlFor="document-title"
          >
            Filename
          </label>
          <input
            aria-label="Filename"
            className="editor-title-input editor-title-input--filename"
            disabled={!state.canWrite || state.isLoading}
            id="document-title"
            onChange={(event) => state.setTitle(event.target.value)}
            placeholder={state.isLoading ? 'Loading document...' : 'Untitled document'}
            value={state.title}
          />
        </div>

        <div className="grid gap-1.5">
          <SummaryRow label="Owner" value={owner?.name ?? 'Unavailable'} />
          <SummaryRow
            label="Access"
            value={document ? getPermissionLabel(document.permission) : 'Loading'}
          />
        </div>

        <div aria-label="Document state" className="editor-context-status grid gap-2">
          <StatusRow label="Save">
            <SaveStatusBadge lastSavedAt={state.lastSavedAt} state={state.saveState} />
          </StatusRow>
          <StatusRow label="Sync">
            <SyncStatusBadge status={state.sync.status} />
          </StatusRow>
        </div>

        {state.sync.conflict ? (
          <ConflictNotice
            conflict={state.sync.conflict}
            onKeepLocalVersion={state.sync.keepLocalVersion}
            onReloadLatest={state.sync.reloadLatest}
          />
        ) : null}
        {state.sync.error ? (
          <p className="m-0 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {state.sync.error}
          </p>
        ) : null}
      </section>

      <Divider />

      <section aria-label="People" className="grid gap-3">
        <PanelHeading icon={UsersRound} title="People" />
        <PersonRow color={localUser.color} detail="Current user" name={localUser.name} />
        <PresenceList
          isRealtimeEnabled={state.collaboration.isRealtimeEnabled}
          users={state.collaboration.users}
        />
      </section>

      <Divider />

      <section aria-label="Document details" className="grid gap-3">
        <PanelHeading icon={FileText} title="Details" />
        <MetadataRow label="Revision" value={document?.revision ? `r${document.revision}` : 'r1'} />
        <MetadataRow
          label="Last synced"
          value={lastSyncedAt ? formatDateTime(lastSyncedAt) : 'Not yet synced'}
        />
        <MetadataRow
          label="Modified"
          value={document?.updatedAt ? formatDateTime(document.updatedAt) : 'Unknown'}
        />
      </section>
    </div>
  );
}

interface PanelHeadingProps {
  /** Icon rendered next to the section title. */
  icon: LucideIcon;
  /** Section title. */
  title: string;
}

/**
 * Renders a small icon heading for context-sidebar sections.
 *
 * @param props - Heading props.
 * @returns Section heading.
 */
function PanelHeading({ icon: Icon, title }: PanelHeadingProps): JSX.Element {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
      <Icon aria-hidden="true" className="h-4 w-4 text-slate-500" />
      {title}
    </div>
  );
}

interface SummaryRowProps {
  /** Compact metadata label. */
  label: string;
  /** Compact metadata value. */
  value: string;
}

interface StatusRowProps {
  /** Badge-like status content. */
  children: JSX.Element;
  /** Status row label. */
  label: string;
}

/**
 * Gives status badges a stable label and panel background.
 *
 * @param props - Status row props.
 * @returns Labeled status row.
 */
function StatusRow({ children, label }: StatusRowProps): JSX.Element {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      {children}
    </div>
  );
}

/**
 * Renders high-priority document metadata near the title.
 *
 * @param props - Summary row props.
 * @returns Compact summary row.
 */
function SummaryRow({ label, value }: SummaryRowProps): JSX.Element {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="min-w-0 truncate text-right font-medium text-slate-800">{value}</span>
    </div>
  );
}

interface PersonRowProps {
  /** Avatar color token or hex color. */
  color?: string;
  /** Metadata line shown below the name. */
  detail: string;
  /** Person display name. */
  name: string;
}

/**
 * Renders a user summary row with a deterministic avatar fallback.
 *
 * @param props - Person row props.
 * @returns Person summary row.
 */
function PersonRow({ color, detail, name }: PersonRowProps): JSX.Element {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar
        alt={name}
        className={getAvatarClassName(color)}
        fallback={getInitials(name)}
        size="sm"
        style={getAvatarStyle(color)}
      />
      <div className="min-w-0">
        <p className="m-0 truncate text-sm font-medium text-slate-950">{name}</p>
        <p className="m-0 text-xs text-slate-500">{detail}</p>
      </div>
    </div>
  );
}

interface PresenceListProps {
  /** Whether realtime awareness is active. */
  isRealtimeEnabled: boolean;
  /** Remote users reported by realtime awareness. */
  users: CollaborationUser[];
}

/**
 * Renders real collaborators when available, or a truthful polling placeholder.
 *
 * @param props - Presence list props.
 * @returns Presence rows or placeholder text.
 */
function PresenceList({ isRealtimeEnabled, users }: PresenceListProps): JSX.Element {
  if (!isRealtimeEnabled) {
    return <PlaceholderText>Live presence unavailable in polling mode.</PlaceholderText>;
  }

  if (users.length === 0) {
    return <PlaceholderText>No active collaborators detected.</PlaceholderText>;
  }

  return (
    <div className="grid gap-2">
      {users.map((user) => (
        <PersonRow color={user.color} detail="Active collaborator" key={user.id} name={user.name} />
      ))}
    </div>
  );
}

interface MetadataRowProps {
  /** Metadata label. */
  label: string;
  /** Metadata value. */
  value: string;
}

/**
 * Renders one key-value metadata row.
 *
 * @param props - Metadata row props.
 * @returns Metadata row.
 */
function MetadataRow({ label, value }: MetadataRowProps): JSX.Element {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="min-w-0 text-right font-medium text-slate-900">{value}</span>
    </div>
  );
}

interface PlaceholderTextProps {
  /** Placeholder text. */
  children: string;
}

/**
 * Renders muted placeholder text inside the collaboration panel.
 *
 * @param props - Placeholder props.
 * @returns Placeholder paragraph.
 */
function PlaceholderText({ children }: PlaceholderTextProps): JSX.Element {
  return (
    <p className="m-0 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-500">
      {children}
    </p>
  );
}

/**
 * Builds initials from a display name.
 *
 * @param name - Display name.
 * @returns One or two uppercase initials.
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
  }

  return (name.trim() || '?').slice(0, 2).toUpperCase();
}

/**
 * Converts backend Tailwind avatar color tokens into component classes.
 *
 * @param color - Backend color token or hex color.
 * @returns Avatar class name for Tailwind tokens.
 */
function getAvatarClassName(color: string | undefined): string | undefined {
  return color?.startsWith('bg-') ? `${color} text-white ring-transparent` : undefined;
}

/**
 * Converts hex collaboration colors into inline avatar styles.
 *
 * @param color - Backend color token or hex color.
 * @returns Inline style for hex colors.
 */
function getAvatarStyle(color: string | undefined): CSSProperties | undefined {
  return color?.startsWith('#') ? { backgroundColor: color, color: '#ffffff' } : undefined;
}

/**
 * Formats an ISO timestamp with date and time for editor metadata.
 *
 * @param value - ISO timestamp.
 * @returns Localized date-time label.
 */
function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}
