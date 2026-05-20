/**
 * Shared TypeScript contracts for the plain-text collaboration feature.
 *
 * The WebSocket protocol intentionally supports only insert/delete operations
 * over code-point positions. Rich-text JSON and CRDT payloads are outside this
 * module's scope.
 */

/** Plain-text insert/delete operation sent through the OT protocol. */
export type CollaborationTextOperation =
  | { type: 'insert'; pos: number; text: string }
  | { type: 'delete'; pos: number; len: number };

/** Remote cursor and selection state exchanged as collaboration presence. */
export interface CollaborationCursorState {
  /** Authenticated user identifier. */
  user_id: string;
  /** Browser/client instance identifier. */
  client_id: string;
  /** Cursor head position in code points. */
  pos: number;
  /** Selection start in code points. */
  selection_start: number;
  /** Selection end in code points. */
  selection_end: number;
  /** Stable display color for the user. */
  color: string;
  /** Human-readable display name. */
  display_name: string;
  /** ISO timestamp for the cursor update. */
  ts: string;
}

/** Pairwise transform case name used by backend and frontend metrics. */
export type CollaborationTransformCase =
  | 'insert/insert'
  | 'insert/delete'
  | 'delete/insert'
  | 'delete/delete';

/** Counters for every pairwise OT transform case. */
export type CollaborationTransformCaseCounts = Record<CollaborationTransformCase, number>;

/** Client-side metrics shown in the editor sidebar. */
export interface CollaborationClientMetrics {
  /** Local operations queued for sending. */
  sentOps: number;
  /** Operation acknowledgements received from the server. */
  ackedOps: number;
  /** Remote operations received from other clients. */
  receivedRemoteOps: number;
  /** Acknowledged operations that required server-side transformation. */
  transformedOps: number;
  /** Local operations currently pending acknowledgement. */
  pendingOps: number;
  /** Last acknowledgement round-trip latency in milliseconds. */
  lastAckLatencyMs: number | null;
  /** Rolling average acknowledgement latency in milliseconds. */
  avgAckLatencyMs: number | null;
  /** Last server processing time reported by the acknowledgement. */
  lastServerProcessingMs: number | null;
  /** Rolling average server processing time reported by acknowledgements. */
  avgServerProcessingMs: number | null;
  /** Pairwise transform-case counters returned by acknowledgements. */
  transformCaseCounts: CollaborationTransformCaseCounts;
}

/** Server-side document metrics returned by the REST and GraphQL APIs. */
export interface CollaborationDocumentMetrics {
  /** Workspace document identifier. */
  documentId: string;
  /** Server-owned collaboration version. */
  version: number;
  /** Current plain-text content length in code points. */
  contentLength: number;
  /** Persisted operations submitted to the server. */
  totalOperationsSent: number;
  /** Persisted operations acknowledged by the server. */
  acknowledgedOperations: number;
  /** Broadcast deliveries to non-origin clients. */
  remoteOperationsReceived: number;
  /** Operations transformed over missed history. */
  transformedOperations: number;
  /** Pairwise transform-case counters. */
  transformCaseCounts: {
    insertInsert: number;
    insertDelete: number;
    deleteInsert: number;
    deleteDelete: number;
  };
  /** Average server-observed acknowledgement latency, if available. */
  avgAckLatencyMs: number | null;
  /** Average server processing time, if available. */
  avgServerProcessingMs: number | null;
  /** Number of recorded divergence events. */
  divergenceEvents: number;
  /** Last accepted operation timestamp. */
  lastOperationAt: string | null;
}

/** Request body used for comparing client and server document hashes. */
export interface CollaborationHashCheckRequest {
  /** Client collaboration version used to compute the hash. */
  version: number;
  /** Stable hash of the client's current plain text. */
  hash: string;
}

/** Hash comparison response used by divergence detection. */
export interface CollaborationHashCheckResponse {
  /** Workspace document identifier. */
  documentId: string;
  /** Current server collaboration version. */
  version: number;
  /** Client version included in the request. */
  clientVersion: number;
  /** Stable hash of the server plain text. */
  serverHash: string;
  /** Stable hash reported by the client. */
  clientHash: string;
  /** True when version and hash both match. */
  inSync: boolean;
  /** True when the client version equals the server version. */
  versionMatches: boolean;
  /** True when the client hash equals the server hash. */
  hashMatches: boolean;
  /** ISO timestamp for the check. */
  checkedAt: string;
}

/** Plain-text server snapshot used for safe client resynchronization. */
export interface CollaborationSnapshot {
  /** Workspace document identifier. */
  documentId: string;
  /** Server-owned plain-text content. */
  content: string;
  /** Server-owned collaboration version. */
  version: number;
  /** Stable hash of the content. */
  hash: string;
  /** Whether the current user may submit edits. */
  canWrite: boolean;
  /** Last server update timestamp. */
  updatedAt: string;
}

/** Divergence lifecycle state displayed in the editor UI. */
export type DivergenceState = 'in_sync' | 'checking' | 'divergence_detected' | 'resyncing' | 'error';

/** Full divergence status returned by the divergence hook. */
export interface DivergenceStatus {
  /** Current divergence lifecycle state. */
  state: DivergenceState;
  /** Last hash comparison response, when one has completed. */
  lastCheck: CollaborationHashCheckResponse | null;
  /** Last divergence/resync error message, if any. */
  error: string | null;
  /** ISO timestamp of the last successful or failed check. */
  lastCheckedAt: string | null;
}
