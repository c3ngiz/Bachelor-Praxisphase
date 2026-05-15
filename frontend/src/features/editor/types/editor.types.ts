import type { Editor, JSONContent } from '@tiptap/core';

import type { AuthUser } from '../../auth/types/auth.types';
import type { DocumentItem, EntityId } from '../../workspace/types/workspace.types';

/** TipTap/ProseMirror JSON used as the persisted document body format. */
export type EditorDocumentContent = JSONContent;

/** Save state shown by the document editor. */
export type DocumentSaveState = 'saved' | 'saving' | 'unsaved' | 'failed';

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
  getDocumentContent(documentId: EntityId): Promise<DocumentEditorLoadResult>;
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
  /** Collaboration state for the current document. */
  collaboration: UseCollaborationResult;
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
