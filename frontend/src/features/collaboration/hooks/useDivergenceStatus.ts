import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

import { env } from '../../../config/env';
import { normalizeApiError } from '../../auth/api/authApiError';
import { collaborationClient } from '../services/collaborationClient';
import type {
  CollaborationHashCheckResponse,
  CollaborationSnapshot,
  DivergenceStatus,
} from '../types/collaboration.types';
import { stableTextHash } from '../utils/contentHash';

/** Options accepted by the divergence detection hook. */
export interface UseDivergenceStatusOptions {
  /** Workspace document identifier. */
  documentId: string;
  /** Whether periodic hash checks should run. */
  enabled: boolean;
  /** Current server-owned collaboration version known by the client. */
  version: number;
  /** Ref containing the editor's latest plain-text content. */
  contentRef: RefObject<string>;
  /** Number of local operations still waiting for acknowledgement. */
  pendingOperationCount: number;
  /** Callback used to apply a resync snapshot to the editor state. */
  onResyncSnapshot: (snapshot: CollaborationSnapshot) => void;
}

/** Commands and status returned by the divergence detection hook. */
export interface UseDivergenceStatusResult {
  /** Current divergence status displayed in the editor UI. */
  divergence: DivergenceStatus;
  /** Immediately perform a hash check when it is safe to do so. */
  checkNow: () => Promise<void>;
  /** Reload the latest server snapshot and replace local editor state. */
  resyncDocument: () => Promise<void>;
}

const initialDivergenceStatus: DivergenceStatus = {
  error: null,
  lastCheck: null,
  lastCheckedAt: null,
  state: 'in_sync',
};

/**
 * Periodically compares the client document hash with the server snapshot.
 *
 * Checks are skipped while local operations are pending, which avoids reporting
 * expected optimistic-edit differences as divergence during normal editing.
 *
 * @param options - Divergence detection options.
 * @returns Divergence status and manual commands.
 */
export function useDivergenceStatus({
  contentRef,
  documentId,
  enabled,
  onResyncSnapshot,
  pendingOperationCount,
  version,
}: UseDivergenceStatusOptions): UseDivergenceStatusResult {
  const [divergence, setDivergence] = useState<DivergenceStatus>(initialDivergenceStatus);
  const lastRequestRef = useRef<{ hash: string; version: number } | null>(null);

  const checkNow = useCallback(async () => {
    if (!enabled || pendingOperationCount > 0) {
      return;
    }

    const hash = stableTextHash(contentRef.current ?? '');
    const lastRequest = lastRequestRef.current;

    if (lastRequest?.hash === hash && lastRequest.version === version) {
      return;
    }

    lastRequestRef.current = { hash, version };
    setDivergence((current) => ({
      ...current,
      error: null,
      state: current.state === 'divergence_detected' ? current.state : 'checking',
    }));

    try {
      const result = await collaborationClient.checkHash(documentId, { hash, version });
      setDivergence(toDivergenceStatus(result));
    } catch (error) {
      const normalized = normalizeApiError(error);
      setDivergence({
        error: normalized.message,
        lastCheck: null,
        lastCheckedAt: new Date().toISOString(),
        state: 'error',
      });
    }
  }, [contentRef, documentId, enabled, pendingOperationCount, version]);

  const resyncDocument = useCallback(async () => {
    setDivergence((current) => ({ ...current, error: null, state: 'resyncing' }));

    try {
      const snapshot = await collaborationClient.getSnapshot(documentId);
      onResyncSnapshot(snapshot);
      lastRequestRef.current = { hash: snapshot.hash, version: snapshot.version };
      setDivergence({
        error: null,
        lastCheck: null,
        lastCheckedAt: new Date().toISOString(),
        state: 'in_sync',
      });
    } catch (error) {
      const normalized = normalizeApiError(error);
      setDivergence((current) => ({
        ...current,
        error: normalized.message,
        lastCheckedAt: new Date().toISOString(),
        state: 'error',
      }));
    }
  }, [documentId, onResyncSnapshot]);

  useEffect(() => {
    if (!enabled) {
      setDivergence(initialDivergenceStatus);
      lastRequestRef.current = null;
      return undefined;
    }

    const initialTimeoutId = window.setTimeout(() => {
      void checkNow();
    }, env.collaborationHashCheckDebounceMs);
    const intervalId = window.setInterval(() => {
      void checkNow();
    }, env.collaborationHashCheckIntervalMs);

    return () => {
      window.clearTimeout(initialTimeoutId);
      window.clearInterval(intervalId);
    };
  }, [checkNow, enabled]);

  return { checkNow, divergence, resyncDocument };
}

/**
 * Converts a backend hash-check response into UI divergence state.
 *
 * @param result - Hash comparison response.
 * @returns UI divergence status.
 */
function toDivergenceStatus(result: CollaborationHashCheckResponse): DivergenceStatus {
  return {
    error: null,
    lastCheck: result,
    lastCheckedAt: result.checkedAt,
    state: result.inSync ? 'in_sync' : 'divergence_detected',
  };
}
