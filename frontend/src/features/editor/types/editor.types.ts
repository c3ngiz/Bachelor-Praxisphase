import type { DocumentItem, EntityId } from '../../workspace/types/workspace.types';
import type { EditorSyncMode } from '../../../config/env';

export type TextOp =
  | { type: 'insert'; pos: number; text: string }
  | { type: 'delete'; pos: number; len: number };

export interface CursorState {
  user_id: string;
  client_id: string;
  pos: number;
  selection_start: number;
  selection_end: number;
  color: string;
  display_name: string;
  ts: string;
}

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

export interface RemoteOperationEvent {
  id: string;
  op: TextOp;
  serverVersion: number;
  receivedAt: number;
}

export interface PlainTextLatencySample {
  opId: string;
  latencyMs: number;
  transformRequired: boolean;
}

export interface PlainTextMetrics {
  sentOps: number;
  ackedOps: number;
  receivedRemoteOps: number;
  transformedOps: number;
  lastAckLatencyMs: number | null;
  avgAckLatencyMs: number | null;
}

/** Revision conflict detected while local edits are still unsaved. */
export interface PlainTextConflict {
  /** Remote revision that arrived after local editing began. */
  remoteRevision: number;
  /** Local revision used by the currently dirty editor state. */
  localRevision: number;
  /** Remote update timestamp returned by the backend. */
  updatedAt: string;
}

export interface PlainTextEditorState {
  clientId: string;
  content: string;
  contentSerial: number;
  canWrite: boolean;
  document: DocumentItem | null;
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
  saveNow: () => Promise<void>;
  sendCursor: (input: { pos: number; selectionStart: number; selectionEnd: number }) => void;
  sendLocalOperation: (op: TextOp, clientHash?: string) => void;
}

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

export interface GetDocumentMetadataOptions {
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

export interface EditorClient {
  getDocumentMetadata(
    documentId: EntityId,
    options?: GetDocumentMetadataOptions,
  ): Promise<DocumentEditorLoadResult>;
  getDocumentContent(
    documentId: EntityId,
    options?: GetDocumentMetadataOptions,
  ): Promise<DocumentContentResult>;
  updateDocumentContent(input: UpdateDocumentContentInput): Promise<DocumentContentResult>;
  subscribeToDocumentContent?(
    documentId: EntityId,
    handlers: DocumentContentSubscriptionHandlers,
  ): () => void;
}
