import { useCallback, useMemo, useRef, useState } from 'react';

import type {
  CollaborationClientMetrics,
  CollaborationTransformCaseCounts,
} from '../types/collaboration.types';

/** Empty transform-case counters used to initialize client metrics. */
export const emptyTransformCaseCounts: CollaborationTransformCaseCounts = {
  'delete/delete': 0,
  'delete/insert': 0,
  'insert/delete': 0,
  'insert/insert': 0,
};

/** Initial client metrics for a new editor session. */
export const emptyCollaborationMetrics: CollaborationClientMetrics = {
  ackedOps: 0,
  avgAckLatencyMs: null,
  avgServerProcessingMs: null,
  lastAckLatencyMs: null,
  lastServerProcessingMs: null,
  pendingOps: 0,
  receivedRemoteOps: 0,
  sentOps: 0,
  transformCaseCounts: emptyTransformCaseCounts,
  transformedOps: 0,
};

/** Input recorded when an acknowledgement arrives. */
export interface CollaborationAckMetricInput {
  /** Operation acknowledgement round-trip latency in milliseconds. */
  latencyMs: number;
  /** Whether the server transformed the acknowledged operation. */
  transformRequired: boolean;
  /** Server processing time reported by the acknowledgement. */
  serverProcessingMs?: number | null;
  /** Pairwise transform-case counters reported by the acknowledgement. */
  transformCaseCounts?: CollaborationTransformCaseCounts;
}

/** Commands returned by the collaboration metrics hook. */
export interface CollaborationMetricsActions {
  /** Count a locally submitted operation. */
  recordSentOperation: () => void;
  /** Count a received acknowledgement and update latency averages. */
  recordAcknowledgement: (input: CollaborationAckMetricInput) => void;
  /** Count a remote operation from another client. */
  recordRemoteOperation: () => void;
  /** Update the pending operation count. */
  setPendingOperationCount: (count: number) => void;
  /** Reset all counters for a new snapshot/session. */
  resetMetrics: () => void;
}

/**
 * Tracks lightweight client-side collaboration metrics for the editor UI.
 *
 * @returns Current metrics plus mutation helpers.
 */
export function useCollaborationMetrics(): readonly [
  CollaborationClientMetrics,
  CollaborationMetricsActions,
] {
  const [metrics, setMetrics] = useState<CollaborationClientMetrics>(emptyCollaborationMetrics);
  const ackLatencySamplesRef = useRef<number[]>([]);
  const serverProcessingSamplesRef = useRef<number[]>([]);

  const recordSentOperation = useCallback(() => {
    setMetrics((current) => ({ ...current, sentOps: current.sentOps + 1 }));
  }, []);

  const recordRemoteOperation = useCallback(() => {
    setMetrics((current) => ({
      ...current,
      receivedRemoteOps: current.receivedRemoteOps + 1,
    }));
  }, []);

  const setPendingOperationCount = useCallback((count: number) => {
    setMetrics((current) => ({ ...current, pendingOps: Math.max(0, count) }));
  }, []);

  const recordAcknowledgement = useCallback((input: CollaborationAckMetricInput) => {
    ackLatencySamplesRef.current = [...ackLatencySamplesRef.current.slice(-99), input.latencyMs];

    if (typeof input.serverProcessingMs === 'number') {
      serverProcessingSamplesRef.current = [
        ...serverProcessingSamplesRef.current.slice(-99),
        input.serverProcessingMs,
      ];
    }

    setMetrics((current) => {
      const transformCaseCounts = mergeTransformCaseCounts(
        current.transformCaseCounts,
        input.transformCaseCounts,
      );

      return {
        ...current,
        ackedOps: current.ackedOps + 1,
        avgAckLatencyMs: average(ackLatencySamplesRef.current),
        avgServerProcessingMs: average(serverProcessingSamplesRef.current),
        lastAckLatencyMs: input.latencyMs,
        lastServerProcessingMs: input.serverProcessingMs ?? current.lastServerProcessingMs,
        transformCaseCounts,
        transformedOps: input.transformRequired
          ? current.transformedOps + 1
          : current.transformedOps,
      };
    });
  }, []);

  const resetMetrics = useCallback(() => {
    ackLatencySamplesRef.current = [];
    serverProcessingSamplesRef.current = [];
    setMetrics(emptyCollaborationMetrics);
  }, []);

  const actions = useMemo<CollaborationMetricsActions>(
    () => ({
      recordAcknowledgement,
      recordRemoteOperation,
      recordSentOperation,
      resetMetrics,
      setPendingOperationCount,
    }),
    [
      recordAcknowledgement,
      recordRemoteOperation,
      recordSentOperation,
      resetMetrics,
      setPendingOperationCount,
    ],
  );

  return [metrics, actions] as const;
}

/**
 * Adds optional transform-case counters into existing counters.
 *
 * @param current - Existing counters.
 * @param incoming - Optional counters reported by an acknowledgement.
 * @returns Merged counters.
 */
function mergeTransformCaseCounts(
  current: CollaborationTransformCaseCounts,
  incoming?: CollaborationTransformCaseCounts,
): CollaborationTransformCaseCounts {
  if (!incoming) {
    return current;
  }

  return {
    'delete/delete': current['delete/delete'] + incoming['delete/delete'],
    'delete/insert': current['delete/insert'] + incoming['delete/insert'],
    'insert/delete': current['insert/delete'] + incoming['insert/delete'],
    'insert/insert': current['insert/insert'] + incoming['insert/insert'],
  };
}

/**
 * Averages a numeric sample list.
 *
 * @param values - Numeric samples.
 * @returns Arithmetic mean, or null when empty.
 */
function average(values: readonly number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
