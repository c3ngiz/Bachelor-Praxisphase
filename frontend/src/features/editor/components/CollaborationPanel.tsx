import type { CSSProperties } from 'react';
import { Clock3, FileText, RadioTower, UsersRound } from 'lucide-react';

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
 * Renders document collaboration, permission, and polling metadata.
 *
 * The panel does not invent realtime presence in polling mode. It shows real
 * awareness users only when the realtime provider is enabled; otherwise it
 * explains that presence is unavailable for polling synchronization.
 *
 * @param props - Collaboration panel props.
 * @returns Collaboration and document information panel.
 */
export function CollaborationPanel({ state }: CollaborationPanelProps): JSX.Element {
  const document = state.document;
  const localUser = state.collaboration.localUser;
  const owner = document?.owner;
  const lastSyncedAt = state.sync.lastSyncedAt ?? state.sync.lastCheckedAt;

  return (
    <div className="grid gap-4">
      <section aria-label="Sync status" className="grid gap-3">
        <div>
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Collaboration
          </p>
          <h2 className="m-0 mt-1 text-lg font-semibold text-slate-950">Document sync</h2>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <SaveStatusBadge lastSavedAt={state.lastSavedAt} state={state.saveState} />
          <SyncStatusBadge status={state.sync.status} />
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
        <PersonRow
          color={localUser.color}
          detail="Current user"
          name={localUser.name}
        />
        {owner ? (
          <PersonRow
            color={owner.avatarColor}
            detail="Document owner"
            name={owner.name}
          />
        ) : (
          <PlaceholderText>Owner metadata is loading.</PlaceholderText>
        )}
        <PresenceList
          isRealtimeEnabled={state.collaboration.isRealtimeEnabled}
          users={state.collaboration.users}
        />
      </section>

      <Divider />

      <section aria-label="Access" className="grid gap-3">
        <PanelHeading icon={RadioTower} title="Access and polling" />
        <MetadataRow
          label="Permission"
          value={document ? getPermissionLabel(document.permission) : 'Loading'}
        />
        <MetadataRow
          label="Polling"
          value={state.sync.isPolling ? `${state.sync.intervalMs / 1000}s interval` : 'Inactive'}
        />
        <MetadataRow
          label="Last synced"
          value={lastSyncedAt ? formatDateTime(lastSyncedAt) : 'Not yet synced'}
        />
        <MetadataRow
          label="Remote revision"
          value={state.sync.remoteVersion ? `r${state.sync.remoteVersion.revision}` : 'Unknown'}
        />
      </section>

      <Divider />

      <section aria-label="Document metadata" className="grid gap-3">
        <PanelHeading icon={FileText} title="Document" />
        <MetadataRow label="Name" value={document?.name ?? 'Loading'} />
        <MetadataRow label="Revision" value={document?.revision ? `r${document.revision}` : 'r1'} />
        <MetadataRow
          label="Modified"
          value={document?.updatedAt ? formatDateTime(document.updatedAt) : 'Unknown'}
        />
        <MetadataRow
          label="Opened"
          value={document?.lastOpenedAt ? formatDateTime(document.lastOpenedAt) : 'Not available'}
        />
      </section>
    </div>
  );
}

interface PanelHeadingProps {
  /** Icon rendered next to the section title. */
  icon: typeof Clock3;
  /** Section title. */
  title: string;
}

/**
 * Renders a small icon heading for right-sidebar sections.
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
    return <PlaceholderText>Presence unavailable in polling mode.</PlaceholderText>;
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
    <p className="m-0 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
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
