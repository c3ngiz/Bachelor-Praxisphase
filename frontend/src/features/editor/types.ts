import type { SyncMetricsEvent, SyncMode } from "./services/documentSync";

export type EditorContent = unknown;

export interface EditorDocument {
  id: string;
  title: string;
  content: EditorContent;
  updatedAt: string;
}

export type EditorSyncMetrics = {
  requests: number;
  messagesReceived: number;
  writesSent: number;
  conflicts: number;
  lastLatencyMs: number | null;
  samples: Array<{
    mode: SyncMode;
    type: SyncMetricsEvent["type"];
    timestamp: string;
    latencyMs?: number;
  }>;
};
