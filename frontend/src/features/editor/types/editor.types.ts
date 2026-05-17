import type { DocumentItem, EntityId } from '../../workspace/types/workspace.types';

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
  status: PlainTextConnectionStatus;
  title: string;
  version: number;
  markRemoteApplied: (eventId: string) => void;
  sendCursor: (input: { pos: number; selectionStart: number; selectionEnd: number }) => void;
  sendLocalOperation: (op: TextOp, clientHash?: string) => void;
}

export interface DocumentEditorLoadResult {
  document: DocumentItem;
  canWrite: boolean;
  revision: number;
  updatedAt: string;
}

export interface GetDocumentMetadataOptions {
  touch?: boolean;
}

export interface EditorClient {
  getDocumentMetadata(
    documentId: EntityId,
    options?: GetDocumentMetadataOptions,
  ): Promise<DocumentEditorLoadResult>;
}
