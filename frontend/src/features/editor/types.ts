import type {
  SyncConnectionState,
  SyncMetricsEvent,
  SyncMode,
} from "./services/documentSync";

export type EditorContent = unknown;

export interface EditorDocument {
  id: string;
  title: string;
  content: EditorContent;
  updatedAt: string;
}

export type EditorSyncMetricSample = {
  id: string;
  mode: SyncMode;
  type: SyncMetricsEvent["type"];
  timestamp: string;
  latencyMs?: number;
  expectedRevision?: number;
  actualRevision?: number;
  connectionState?: SyncConnectionState;
  note?: string;
};

export type EditorSyncMetricsSummary = {
  writesSent: number;
  requests: number;
  messagesReceived: number;
  conflicts: number;
  latestLatencyMs: number | null;
  averageLatencyMs: number | null;
  minLatencyMs: number | null;
  maxLatencyMs: number | null;
  activeDurationMs: number;
  lastConflictAt: string | null;
  lastConflictExpectedRevision: number | null;
  lastConflictActualRevision: number | null;
};

export type EditorSyncMetricsExport = {
  schemaVersion: 1;
  sessionId: string;
  documentId: string | null;
  mode: SyncMode;
  startedAt: string;
  endedAt: string;
  samples: EditorSyncMetricSample[];
  summary: EditorSyncMetricsSummary;
};

export type EditorSyncMetrics = EditorSyncMetricsSummary & {
  sessionId: string;
  startedAt: string;
  mode: SyncMode;
  samples: EditorSyncMetricSample[];
};
