import type { Editor, JSONContent } from '@tiptap/core';
import type { CSSProperties } from 'react';

import type { AuthUser } from '../../auth/types/auth.types';
import type { DocumentItem, EntityId } from '../../workspace/types/workspace.types';

/** TipTap/ProseMirror JSON used as the persisted document body format. */
export type EditorDocumentContent = JSONContent;

/** Save state shown by the document editor. */
export type DocumentSaveState = 'saved' | 'saving' | 'unsaved' | 'failed';

/** Polling synchronization state shown by the document editor. */
export type DocumentSyncStatus =
  | 'idle'
  | 'paused'
  | 'checking'
  | 'synced'
  | 'remote-applied'
  | 'conflict'
  | 'error';

/** Text alignment values supported by the document editor toolbar. */
export type EditorTextAlignment = 'left' | 'center' | 'right' | 'justify';

/** Block style values exposed by the editor sidebar. */
export type EditorBlockStyle = 'paragraph' | 'heading1' | 'heading2';

/** Real-time collaboration connection state exposed to editor UI. */
export type CollaborationConnectionState =
  | 'disabled'
  | 'connecting'
  | 'connected'
  | 'synced'
  | 'disconnected'
  | 'error';

/** User identity stored in collaboration awareness state. */
export interface CollaborationUser {
  /** Browser-local Yjs/Hocuspocus client identifier. */
  clientId?: number;
  /** Application user identifier when authenticated. */
  id: EntityId;
  /** Display name rendered beside remote cursors. */
  name: string;
  /** Cursor and presence accent color. */
  color: string;
}

/** Stable backend marker used to compare persisted document content revisions. */
export interface DocumentContentVersion {
  /** Monotonic backend revision incremented on every content save. */
  revision: number;
  /** Backend timestamp attached to the content row for display only. */
  updatedAt: string | null;
}

/** Conflict detected when polling sees newer remote content during local edits. */
export interface EditorSyncConflict {
  /** Local version the editor was based on when the conflict was detected. */
  localVersion: DocumentContentVersion;
  /** Newer remote version available from the backend. */
  remoteVersion: DocumentContentVersion;
  /** ISO timestamp for when the polling hook detected the conflict. */
  detectedAt: string;
}

/** Document content payload normalized for editor hooks and services. */
export interface DocumentEditorLoadResult {
  /** Workspace document metadata. */
  document: DocumentItem;
  /** Current user permission resolved by the backend. */
  canWrite: boolean;
  /** Persisted TipTap document content. */
  content: EditorDocumentContent;
  /** Optimistic revision for REST autosave conflict checks. */
  revision: number;
  /** ISO timestamp of the last persisted content update. */
  updatedAt: string;
}

/** Options accepted when loading editor content from a backend transport. */
export interface GetDocumentContentOptions {
  /**
   * Whether the backend should update the document's last-opened metadata.
   *
   * Polling requests set this to false so sync checks stay read-only and do
   * not move timestamps that are unrelated to content changes.
   */
  touch?: boolean;
}

/** Payload sent when saving document content. */
export interface SaveDocumentContentInput {
  /** TipTap JSON to persist. */
  content: EditorDocumentContent;
  /** Expected backend revision for optimistic save checks. */
  revision: number;
  /** Current document title. */
  title: string;
}

/** Client contract implemented by REST and future GraphQL editor clients. */
export interface EditorClient {
  /**
   * Loads persisted document content for an editor session.
   *
   * @param documentId - Workspace document identifier.
   * @returns Normalized document content and permission state.
   */
  getDocumentContent(
    documentId: EntityId,
    options?: GetDocumentContentOptions,
  ): Promise<DocumentEditorLoadResult>;
  /**
   * Persists document content and title changes.
   *
   * @param documentId - Workspace document identifier.
   * @param input - Content save payload.
   * @returns Updated content metadata.
   */
  saveDocumentContent(
    documentId: EntityId,
    input: SaveDocumentContentInput,
  ): Promise<DocumentEditorLoadResult>;
}

/** Collaboration state returned by the Yjs/Hocuspocus adapter hook. */
export interface UseCollaborationResult {
  /** Whether the real-time transport is enabled through frontend env flags. */
  isRealtimeEnabled: boolean;
  /** Document-specific collaboration room name. */
  roomName: string;
  /** Local Yjs document reserved for future real-time sync. */
  ydoc: unknown;
  /** Hocuspocus-compatible provider when real-time mode is active. */
  provider: unknown | null;
  /** Local user details used for collaboration awareness. */
  localUser: CollaborationUser;
  /** Remote users currently visible through awareness state. */
  users: CollaborationUser[];
  /** Current connection state. */
  status: CollaborationConnectionState;
}

/** State and commands returned by the polling synchronization hook. */
export interface UseEditorPollingSyncResult {
  /** Current polling and remote synchronization status. */
  status: DocumentSyncStatus;
  /** Whether a polling timer is active for the visible document tab. */
  isPolling: boolean;
  /** Polling interval in milliseconds. */
  intervalMs: number;
  /** Last time a poll request completed successfully or failed. */
  lastCheckedAt: string | null;
  /** Last time the local editor applied or acknowledged the remote revision. */
  lastSyncedAt: string | null;
  /** Latest remote version observed by the polling loop. */
  remoteVersion: DocumentContentVersion | null;
  /** Current unsaved-local-vs-remote conflict, if any. */
  conflict: EditorSyncConflict | null;
  /** Last polling error message, if a sync request failed. */
  error: string | null;
  /** Runs an immediate sync check using the same conflict-safe rules. */
  pollNow: () => Promise<void>;
  /** Applies the conflicted remote content and clears local unsaved edits. */
  reloadLatest: () => void;
  /** Keeps local edits and adopts the latest remote revision before saving. */
  keepLocalVersion: () => void;
}

/** Reactive toolbar state derived from the current TipTap selection. */
export interface EditorToolbarState {
  /** Active text alignment. */
  alignment: EditorTextAlignment;
  /** Active block style for the current selection. */
  blockStyle: EditorBlockStyle;
  /** Whether bold is active. */
  bold: boolean;
  /** Whether bullet list is active. */
  bulletList: boolean;
  /** Active font family value. */
  fontFamily: string;
  /** Active font size value. */
  fontSize: string;
  /** Active highlight color value. */
  highlight: string;
  /** Whether italic is active. */
  italic: boolean;
  /** Whether ordered list is active. */
  orderedList: boolean;
  /** Active text color value. */
  textColor: string;
  /** Whether underline is active. */
  underline: boolean;
}

/** Typed command facade used by presentational toolbar controls. */
export interface EditorCommandApi {
  /** Whether command controls should be disabled. */
  disabled: boolean;
  /** Selection-derived toolbar state. */
  state: EditorToolbarState;
  /** Sets the active block style. */
  setBlockStyle: (style: EditorBlockStyle) => void;
  /** Toggles bold text. */
  toggleBold: () => void;
  /** Toggles italic text. */
  toggleItalic: () => void;
  /** Toggles underlined text. */
  toggleUnderline: () => void;
  /** Toggles the default highlight color. */
  toggleHighlight: () => void;
  /** Sets paragraph or heading alignment. */
  setAlignment: (alignment: EditorTextAlignment) => void;
  /** Toggles a bullet list. */
  toggleBulletList: () => void;
  /** Toggles an ordered list. */
  toggleOrderedList: () => void;
  /** Sets or clears font family. */
  setFontFamily: (fontFamily: string) => void;
  /** Sets or clears font size. */
  setFontSize: (fontSize: string) => void;
  /** Sets or clears text color. */
  setTextColor: (color: string) => void;
  /** Sets or clears text highlight. */
  setHighlight: (color: string) => void;
  /** Runs undo when available. */
  undo: () => void;
  /** Runs redo when available. */
  redo: () => void;
}

/** Visual pagination state for the single TipTap editor surface. */
export interface EditorPaginationState {
  /** Number of visual A4 sheets needed for the measured content. */
  pageCount: number;
  /** Zero-based indexes used for rendering page backgrounds. */
  pageIndexes: number[];
  /** Inline stack height required for positioned page backgrounds. */
  pageStackStyle: CSSProperties;
}

/** State returned by the document editor orchestration hook. */
export interface UseDocumentEditorResult {
  /** TipTap editor instance. */
  editor: Editor | null;
  /** Workspace document metadata once loaded. */
  document: DocumentItem | null;
  /** Editable title shown above the page canvas. */
  title: string;
  /** Whether the initial document load is pending. */
  isLoading: boolean;
  /** Last load or save error message. */
  error: string | null;
  /** Whether the backend allows the current user to edit. */
  canWrite: boolean;
  /** Whether local content differs from the last acknowledged save. */
  hasUnsavedChanges: boolean;
  /** Current save state. */
  saveState: DocumentSaveState;
  /** ISO timestamp of the last successful save. */
  lastSavedAt: string | null;
  /** Visual A4 page count calculated from editor content height. */
  pageCount: number;
  /** Visual pagination details used by the canvas. */
  pagination: EditorPaginationState;
  /** Collaboration state for the current document. */
  collaboration: UseCollaborationResult;
  /** Polling synchronization state for REST collaboration mode. */
  sync: UseEditorPollingSyncResult;
  /** Updates the editable document title. */
  setTitle: (title: string) => void;
  /** Saves current content immediately. */
  saveNow: () => Promise<void>;
}

/** Inputs used by collaboration setup helpers. */
export interface CollaborationIdentityInput {
  /** Authenticated user, or null while auth state is unavailable. */
  user: AuthUser | null;
  /** Document identifier used to derive a stable fallback color. */
  documentId: EntityId;
}
