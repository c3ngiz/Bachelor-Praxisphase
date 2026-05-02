import { useCallback, useMemo, useState } from "react";
import type {
  EditorSyncMetricSample,
  EditorSyncMetrics,
  EditorSyncMetricsExport,
  EditorSyncMetricsSummary,
} from "../types";
import type { SyncMetricsEvent, SyncMode } from "../services/documentSync";

function nowIso(): string {
  return new Date().toISOString();
}

function createSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `sync-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function calculateLatency(sentAt?: string): number | null {
  if (!sentAt) {
    return null;
  }

  const sentAtMs = new Date(sentAt).getTime();

  if (Number.isNaN(sentAtMs)) {
    return null;
  }

  return Date.now() - sentAtMs;
}

function summarizeSamples(
  startedAt: string,
  samples: EditorSyncMetricSample[],
): EditorSyncMetricsSummary {
  const latencies = samples
    .map((sample) => sample.latencyMs)
    .filter((latency): latency is number => typeof latency === "number");
  const conflictSamples = samples.filter((sample) => sample.type === "conflict");
  const lastConflict = conflictSamples.at(-1);
  const latestLatencyMs = latencies.at(-1) ?? null;
  const minLatencyMs = latencies.length > 0 ? Math.min(...latencies) : null;
  const maxLatencyMs = latencies.length > 0 ? Math.max(...latencies) : null;
  const averageLatencyMs =
    latencies.length > 0
      ? latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length
      : null;

  return {
    writesSent: samples.filter((sample) => sample.type === "sent").length,
    requests: samples.filter((sample) => sample.type === "request").length,
    messagesReceived: samples.filter((sample) => sample.type === "received").length,
    conflicts: conflictSamples.length,
    latestLatencyMs,
    averageLatencyMs,
    minLatencyMs,
    maxLatencyMs,
    activeDurationMs: Date.now() - new Date(startedAt).getTime(),
    lastConflictAt: lastConflict?.timestamp ?? null,
    lastConflictExpectedRevision: lastConflict?.expectedRevision ?? null,
    lastConflictActualRevision: lastConflict?.actualRevision ?? null,
  };
}

function createSample(event: SyncMetricsEvent): EditorSyncMetricSample {
  const latencyMs =
    event.type === "received" ? calculateLatency(event.sentAt) : undefined;
  const timestamp =
    event.type === "sent"
      ? event.sentAt
      : event.type === "received"
        ? event.receivedAt
        : event.timestamp;

  return {
    id: createSessionId(),
    mode: event.mode,
    type: event.type,
    timestamp,
    latencyMs: latencyMs ?? undefined,
    expectedRevision:
      event.type === "conflict" ? event.expectedRevision : undefined,
    actualRevision: event.type === "conflict" ? event.actualRevision : undefined,
    connectionState:
      event.type === "connection" ? event.connectionState : undefined,
    note:
      event.type === "mode-switch" || event.type === "connection"
        ? event.note
        : undefined,
  };
}

function createInitialMetrics(mode: SyncMode): EditorSyncMetrics {
  const startedAt = nowIso();

  return {
    sessionId: createSessionId(),
    startedAt,
    mode,
    samples: [],
    ...summarizeSamples(startedAt, []),
  };
}

function downloadJson(filename: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function useSyncMetrics(mode: SyncMode, documentId: string | null) {
  const [metrics, setMetrics] = useState<EditorSyncMetrics>(() =>
    createInitialMetrics(mode),
  );

  const recordMetric = useCallback((event: SyncMetricsEvent) => {
    setMetrics((currentMetrics) => {
      const samples = [...currentMetrics.samples, createSample(event)].slice(-1000);

      return {
        ...currentMetrics,
        mode: event.mode,
        samples,
        ...summarizeSamples(currentMetrics.startedAt, samples),
      };
    });
  }, []);

  const resetMetrics = useCallback(
    (nextMode = mode, note = "Metrics reset.") => {
      const nextMetrics = createInitialMetrics(nextMode);
      const sample = createSample({
        type: "mode-switch",
        mode: nextMode,
        timestamp: nowIso(),
        note,
      });
      const samples = [sample];

      setMetrics({
        ...nextMetrics,
        samples,
        ...summarizeSamples(nextMetrics.startedAt, samples),
      });
    },
    [mode],
  );

  const recordModeSwitch = useCallback(
    (nextMode: SyncMode) => {
      resetMetrics(nextMode, `Switched to ${nextMode}.`);
    },
    [resetMetrics],
  );

  const exportPayload = useMemo<EditorSyncMetricsExport>(() => {
    return {
      schemaVersion: 1,
      sessionId: metrics.sessionId,
      documentId,
      mode: metrics.mode,
      startedAt: metrics.startedAt,
      endedAt: nowIso(),
      samples: metrics.samples,
      summary: {
        writesSent: metrics.writesSent,
        requests: metrics.requests,
        messagesReceived: metrics.messagesReceived,
        conflicts: metrics.conflicts,
        latestLatencyMs: metrics.latestLatencyMs,
        averageLatencyMs: metrics.averageLatencyMs,
        minLatencyMs: metrics.minLatencyMs,
        maxLatencyMs: metrics.maxLatencyMs,
        activeDurationMs: metrics.activeDurationMs,
        lastConflictAt: metrics.lastConflictAt,
        lastConflictExpectedRevision: metrics.lastConflictExpectedRevision,
        lastConflictActualRevision: metrics.lastConflictActualRevision,
      },
    };
  }, [documentId, metrics]);

  const exportMetrics = useCallback(() => {
    const safeDocumentId = documentId ?? "unknown-document";
    downloadJson(
      `docflow-sync-${safeDocumentId}-${metrics.sessionId}.json`,
      exportPayload,
    );
  }, [documentId, exportPayload, metrics.sessionId]);

  return {
    metrics,
    recordMetric,
    recordModeSwitch,
    resetMetrics,
    exportMetrics,
    exportPayload,
  };
}
