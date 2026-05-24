import type { DocumentItem, EntityId } from '../../workspace/types/workspace.types';
import type { EditorSyncMode } from '../../../config/env';
import type {
  CollaborationClientMetrics,
  CollaborationCursorState,
  CollaborationTextOperation,
  DivergenceStatus,
} from '../../collaboration/types/collaboration.types';

/** Plain-text insert/delete operation used by the editor collaboration hook. */
export type TextOp = CollaborationTextOperation;

/** Remote cursor and selection state used by the editor UI. */
export type CursorState = CollaborationCursorState;

/**
 * Client-to-server messages supported by the plain-text collaboration WebSocket.
 */
export type ClientMessage =
  | { type: 'join'; client_id: string }
  | {
      type: 'op';
      op_id: string;
      client_id: string;
      doc_id: string;
      base_version: number;
      op: TextOp;
      client_ts: string;
      client_hash?: string;
    }
  | { type: 'cursor'; cursor: CursorState }
  | { type: 'presence'; client_id: string; status: 'active' | 'idle' | 'away'; ts: string }
  | { type: 'ping'; ping_id: string; client_ts: string };

/**
 * Server-to-client messages emitted by the plain-text collaboration WebSocket.
 */
export type ServerMessage =
  | {
      type: 'snapshot';
      doc_id: string;
      content: string;
      version: number;
      can_write: boolean;
      presence: CursorState[];
      server_ts: string;
    }
  | {
      type: 'ack';
      op_id: string;
      server_version: number;
      op: TextOp;
      transform_required: boolean;
      server_ts: string;
      server_processing_ms?: number | null;
      transform_case_counts?: CollaborationClientMetrics['transformCaseCounts'];
    }
  | {
      type: 'broadcast_op';
      op_id: string;
      client_id: string;
      doc_id: string;
      server_version: number;
      op: TextOp;
      client_ts: string;
      server_ts: string;
    }
  | { type: 'cursor'; cursor: CursorState }
  | { type: 'presence'; users: CursorState[] }
  | { type: 'error'; code: string; message: string; recoverable: boolean }
  | { type: 'pong'; ping_id: string; client_ts: string; server_ts: string };

/**
 * Transport lifecycle state shown by the editor shell and sidebar.
 */
export type PlainTextConnectionStatus =
  | 'loading'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

/** Save state shown by the plain-text editor toolbar. */
export type PlainTextSaveStatus =
  | 'idle'
  | 'live'
  | 'unsaved'
  | 'saving'
  | 'saved'
  | 'conflict'
  | 'error';

/**
 * Remote operation queued for application to the local CodeMirror document.
 */
export interface RemoteOperationEvent {
  id: string;
  op: TextOp;
  serverVersion: number;
  receivedAt: number;
}

/**
 * Round-trip latency sample recorded when the backend acknowledges an operation.
 */
export interface PlainTextLatencySample {
  opId: string;
  latencyMs: number;
  transformRequired: boolean;
}

/** Client-side collaboration metrics shown in the editor sidebar. */
export type PlainTextMetrics = CollaborationClientMetrics;

/** Revision conflict detected while local edits are still unsaved. */
export interface PlainTextConflict {
  /** Remote revision that arrived after local editing began. */
  remoteRevision: number;
  /** Local revision used by the currently dirty editor state. */
  localRevision: number;
  /** Remote update timestamp returned by the backend. */
  updatedAt: string;
}

/**
 * Complete state contract consumed by the plain-text editor layout.
 *
 * The state includes document metadata, transport status, local content,
 * collaborator presence, divergence status, metrics, and all command handlers
 * required by the CodeMirror surface and sidebar.
 */
export interface PlainTextEditorState {
  clientId: string;
  content: string;
  contentSerial: number;
  canWrite: boolean;
  document: DocumentItem | null;
  divergence: DivergenceStatus;
  error: string | null;
  isLoading: boolean;
  localUser: CursorState;
  metrics: PlainTextMetrics;
  remoteCursors: CursorState[];
  remoteOperation: RemoteOperationEvent | null;
  saveStatus: PlainTextSaveStatus;
  status: PlainTextConnectionStatus;
  syncMode: EditorSyncMode;
  title: string;
  version: number;
  conflict: PlainTextConflict | null;
  markRemoteApplied: (eventId: string) => void;
  onContentChanged: (content: string) => void;
  resyncDocument: () => Promise<void>;
  saveNow: () => Promise<void>;
  sendCursor: (input: { pos: number; selectionStart: number; selectionEnd: number }) => void;
  sendLocalOperation: (op: TextOp, clientHash?: string) => void;
}

/**
 * Document metadata returned before or alongside editor content.
 */
export interface DocumentEditorLoadResult {
  document: DocumentItem;
  canWrite: boolean;
  revision: number;
  updatedAt: string;
}

/** JSON value accepted by the document content API. */
export type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];

/** JSON object accepted by the document content API. */
export interface JsonObject {
  /** Arbitrary JSON object fields. */
  [key: string]: JsonValue;
}

/** Document content payload normalized across REST and GraphQL clients. */
export interface DocumentContentResult extends DocumentEditorLoadResult {
  /** Raw JSON document content returned by the backend. */
  content: JsonObject;
  /** Plain-text projection rendered by CodeMirror. */
  textContent: string;
}

/**
 * Options accepted by document load APIs.
 */
export interface GetDocumentMetadataOptions {
  /** Whether loading the document should update backend last-opened metadata. */
  touch?: boolean;
}

/** Input used to save document content. */
export interface UpdateDocumentContentInput {
  /** Document being updated. */
  documentId: EntityId;
  /** Next JSON document content. */
  content: JsonObject;
  /** Revision being replaced optimistically. */
  revision: number;
  /** Optional title rename sent with the save. */
  title?: string;
}

/** Event handlers used by GraphQL document-content subscriptions. */
export interface DocumentContentSubscriptionHandlers {
  /** Called after the subscription socket is accepted. */
  onConnected?: () => void;
  /** Called after the subscription socket closes or completes. */
  onDisconnected?: () => void;
  /** Called when a subscription transport or execution error occurs. */
  onError?: (error: Error) => void;
  /** Called for each remote document content payload. */
  onNext: (content: DocumentContentResult) => void;
}

/**
 * Contract implemented by REST and GraphQL document editor clients.
 */
export interface EditorClient {
  /**
   * Load document metadata and permission state without requiring content.
   *
   * @param documentId - Workspace document identifier.
   * @param options - Optional metadata loading behavior.
   * @returns Document metadata, permission state, and revision.
   */
  getDocumentMetadata(
    documentId: EntityId,
    options?: GetDocumentMetadataOptions,
  ): Promise<DocumentEditorLoadResult>;
  /**
   * Load document metadata and JSON/plain-text content.
   *
   * @param documentId - Workspace document identifier.
   * @param options - Optional content loading behavior.
   * @returns Normalized document content payload.
   */
  getDocumentContent(
    documentId: EntityId,
    options?: GetDocumentMetadataOptions,
  ): Promise<DocumentContentResult>;
  /**
   * Save JSON document content using optimistic revision metadata.
   *
   * @param input - Content save request.
   * @returns Updated document content and revision.
   */
  updateDocumentContent(input: UpdateDocumentContentInput): Promise<DocumentContentResult>;
  /**
   * Subscribe to remote document-content changes when the client supports it.
   *
   * @param documentId - Workspace document identifier.
   * @param handlers - Subscription lifecycle and payload handlers.
   * @returns Unsubscribe callback.
   */
  subscribeToDocumentContent?(
    documentId: EntityId,
    handlers: DocumentContentSubscriptionHandlers,
  ): () => void;
}
