import { useCallback, useEffect, useRef, useState } from 'react';

import { normalizeApiError } from '../../auth/api/authApiError';
import type { EntityId } from '../../workspace/types/workspace.types';
import { editorService } from '../services/editorService';
import {
  compareDocumentContentVersions,
  getDocumentContentVersion,
  isRemoteVersionNewer,
} from '../utils/contentVersion';
import type {
  DocumentContentVersion,
  DocumentEditorLoadResult,
  DocumentSyncStatus,
  EditorSyncConflict,
  UseEditorPollingSyncResult,
} from '../types/editor.types';

/** Default document polling interval in milliseconds. */
export const DEFAULT_EDITOR_POLLING_INTERVAL_MS = 4000;

/** Options accepted by the polling synchronization hook. */
export interface UseEditorPollingSyncOptions {
  /** Workspace document identifier. */
  documentId: EntityId;
  /** Version currently acknowledged by the local editor. */
  currentVersion: DocumentContentVersion | null;
  /** Whether polling may run for the current route state. */
  enabled: boolean;
  /** Whether local editor or title changes are waiting to be saved. */
  hasUnsavedChanges: boolean;
  /** Polling interval in milliseconds. */
  intervalMs?: number;
  /** Applies a remote snapshot when the local editor is clean. */
  onApplyRemoteContent: (result: DocumentEditorLoadResult) => void;
  /** Adopts a remote revision while preserving local unsaved edits. */
  onKeepLocalVersion: (result: DocumentEditorLoadResult) => void;
}

interface SyncOptionsRefValue extends UseEditorPollingSyncOptions {
  /** Concrete interval after applying the default value. */
  intervalMs: number;
}

/**
 * Polls the REST document endpoint and applies remote revisions safely.
 *
 * The hook fetches a read-only content snapshot every 4 seconds by default
 * while the document is open and the browser tab is visible. A newer backend
 * revision is applied immediately only when the local editor has no unsaved
 * changes. If local edits exist, the hook stores the remote snapshot, exposes a
 * conflict state, and waits for the user to reload the latest content or keep
 * their local version.
 *
 * @param options - Polling synchronization options.
 * @returns Polling status, conflict state, and conflict-resolution commands.
 */
export function useEditorPollingSync({
  documentId,
  currentVersion,
  enabled,
  hasUnsavedChanges,
  intervalMs = DEFAULT_EDITOR_POLLING_INTERVAL_MS,
  onApplyRemoteContent,
  onKeepLocalVersion,
}: UseEditorPollingSyncOptions): UseEditorPollingSyncResult {
  const [status, setStatus] = useState<DocumentSyncStatus>('idle');
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [remoteVersion, setRemoteVersion] = useState<DocumentContentVersion | null>(null);
  const [conflict, setConflict] = useState<EditorSyncConflict | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(() => isDocumentVisible());
  const inFlightRef = useRef(false);
  const pendingRemoteRef = useRef<DocumentEditorLoadResult | null>(null);
  const optionsRef = useRef<SyncOptionsRefValue>({
    currentVersion,
    documentId,
    enabled,
    hasUnsavedChanges,
    intervalMs,
    onApplyRemoteContent,
    onKeepLocalVersion,
  });

  useEffect(() => {
    optionsRef.current = {
      currentVersion,
      documentId,
      enabled,
      hasUnsavedChanges,
      intervalMs,
      onApplyRemoteContent,
      onKeepLocalVersion,
    };
  }, [
    currentVersion,
    documentId,
    enabled,
    hasUnsavedChanges,
    intervalMs,
    onApplyRemoteContent,
    onKeepLocalVersion,
  ]);

  useEffect(() => {
    pendingRemoteRef.current = null;
    setConflict(null);
    setError(null);
    setLastCheckedAt(null);
    setLastSyncedAt(null);
    setRemoteVersion(null);
    setStatus('idle');
  }, [documentId]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    function handleVisibilityChange(): void {
      setIsVisible(isDocumentVisible());
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const pollNow = useCallback(async () => {
    const options = optionsRef.current;

    if (!options.enabled) {
      setStatus('idle');
      return;
    }

    if (!isDocumentVisible()) {
      setStatus((currentStatus) => (currentStatus === 'conflict' ? currentStatus : 'paused'));
      return;
    }

    if (inFlightRef.current || !options.currentVersion) {
      return;
    }

    inFlightRef.current = true;
    setStatus((currentStatus) => (currentStatus === 'conflict' ? currentStatus : 'checking'));
    setError(null);

    try {
      const result = await editorService.getDocumentContent(options.documentId, {
        touch: false,
      });
      const checkedAt = new Date().toISOString();
      const nextRemoteVersion = getDocumentContentVersion(result);

      setLastCheckedAt(checkedAt);
      setRemoteVersion(nextRemoteVersion);

      if (compareDocumentContentVersions(nextRemoteVersion, options.currentVersion) <= 0) {
        setStatus((currentStatus) => (currentStatus === 'conflict' ? currentStatus : 'synced'));
        return;
      }

      if (!isRemoteVersionNewer(nextRemoteVersion, options.currentVersion)) {
        setStatus((currentStatus) => (currentStatus === 'conflict' ? currentStatus : 'synced'));
        return;
      }

      if (!options.hasUnsavedChanges) {
        pendingRemoteRef.current = null;
        setConflict(null);
        options.onApplyRemoteContent(result);
        setLastSyncedAt(checkedAt);
        setStatus('remote-applied');
        return;
      }

      pendingRemoteRef.current = result;
      setConflict({
        detectedAt: checkedAt,
        localVersion: options.currentVersion,
        remoteVersion: nextRemoteVersion,
      });
      setStatus('conflict');
    } catch (requestError) {
      setLastCheckedAt(new Date().toISOString());
      setError(normalizeApiError(requestError).message);
      setStatus('error');
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  const reloadLatest = useCallback(() => {
    const result = pendingRemoteRef.current;

    if (!result) {
      return;
    }

    const now = new Date().toISOString();

    pendingRemoteRef.current = null;
    setConflict(null);
    setError(null);
    setRemoteVersion(getDocumentContentVersion(result));
    optionsRef.current.onApplyRemoteContent(result);
    setLastSyncedAt(now);
    setStatus('remote-applied');
  }, []);

  const keepLocalVersion = useCallback(() => {
    const result = pendingRemoteRef.current;

    if (!result) {
      return;
    }

    const now = new Date().toISOString();

    pendingRemoteRef.current = null;
    setConflict(null);
    setError(null);
    setRemoteVersion(getDocumentContentVersion(result));
    optionsRef.current.onKeepLocalVersion(result);
    setLastSyncedAt(now);
    setStatus('synced');
  }, []);

  useEffect(() => {
    if (conflict) {
      return;
    }

    if (!enabled) {
      setStatus('idle');
      return;
    }

    if (!isVisible) {
      setStatus('paused');
    }
  }, [conflict, enabled, isVisible]);

  useEffect(() => {
    if (!enabled || !isVisible) {
      return undefined;
    }

    void pollNow();

    const intervalId = window.setInterval(() => {
      void pollNow();
    }, intervalMs);

    return () => window.clearInterval(intervalId);
  }, [enabled, intervalMs, isVisible, pollNow]);

  return {
    conflict,
    error,
    intervalMs,
    isPolling: enabled && isVisible,
    keepLocalVersion,
    lastCheckedAt,
    lastSyncedAt,
    pollNow,
    reloadLatest,
    remoteVersion,
    status,
  };
}

/**
 * Reads browser tab visibility for polling throttling.
 *
 * @returns True when the document is visible or when the DOM is unavailable.
 */
function isDocumentVisible(): boolean {
  return typeof document === 'undefined' || document.visibilityState === 'visible';
}
