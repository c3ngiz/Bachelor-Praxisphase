import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { env } from '../../../config/env';
import { normalizeApiError } from '../../auth/api/authApiError';
import { authTokenStorage } from '../../auth/api/authTokenStorage';
import { useAuth } from '../../auth/hooks/useAuth';
import type { DocumentItem } from '../../workspace/types/workspace.types';
import { plainTextToTiptap } from '../services/editorContentMappers';
import { editorService } from '../services/editorService';
import { getEditorUserColor, normalizeEditorColor } from '../utils/editorIdentity';
import {
  applyTextOperation,
  transformCursor,
  transformTextOperation,
  type OperationIdentity,
} from '../utils/otTransform';
import type {
  ClientMessage,
  CursorState,
  DocumentContentResult,
  PlainTextEditorState,
  PlainTextLatencySample,
  PlainTextMetrics,
  RemoteOperationEvent,
  ServerMessage,
  TextOp,
} from '../types/editor.types';

interface QueuedOperation {
  opId: string;
  op: TextOp;
  clientTs: string;
  clientHash?: string;
  sendStartedAt: number | null;
}

const emptyMetrics: PlainTextMetrics = {
  ackedOps: 0,
  avgAckLatencyMs: null,
  lastAckLatencyMs: null,
  receivedRemoteOps: 0,
  sentOps: 0,
  transformedOps: 0,
};

/**
 * Selects the configured editor synchronization transport for a document route.
 *
 * @param documentId - Workspace document identifier.
 * @returns Plain-text editor state and command handlers.
 */
export function usePlainTextCollaboration(documentId: string): PlainTextEditorState {
  if (env.editorSyncMode === 'polling') {
    return usePollingPlainTextEditor(documentId, 'polling');
  }

  if (env.editorSyncMode === 'subscription') {
    return usePollingPlainTextEditor(documentId, 'subscription');
  }

  return useWebSocketPlainTextEditor(documentId);
}

/**
 * Uses the backend WebSocket OT protocol for low-latency collaborative editing.
 *
 * @param documentId - Workspace document identifier.
 * @returns Plain-text editor state.
 */
function useWebSocketPlainTextEditor(documentId: string): PlainTextEditorState {
  const { user } = useAuth();
  const clientId = useMemo(() => createClientId(), []);
  const localUser = useMemo<CursorState>(() => {
    const userId = user?.id ?? `anonymous-${clientId}`;

    return {
      client_id: clientId,
      color: normalizeEditorColor(user?.avatarColor, getEditorUserColor(userId)),
      display_name: user?.name ?? 'Anonymous user',
      pos: 0,
      selection_end: 0,
      selection_start: 0,
      ts: new Date().toISOString(),
      user_id: userId,
    };
  }, [clientId, user]);
  const [document, setDocument] = useState<DocumentItem | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [contentSerial, setContentSerial] = useState(0);
  const [canWrite, setCanWrite] = useState(false);
  const [version, setVersion] = useState(0);
  const [status, setStatus] = useState<PlainTextEditorState['status']>('loading');
  const [error, setError] = useState<string | null>(null);
  const [remoteCursors, setRemoteCursors] = useState<CursorState[]>([]);
  const [remoteOperation, setRemoteOperation] = useState<RemoteOperationEvent | null>(null);
  const [metrics, setMetrics] = useState<PlainTextMetrics>(emptyMetrics);
  const wsRef = useRef<WebSocket | null>(null);
  const queueRef = useRef<QueuedOperation[]>([]);
  const inFlightRef = useRef<QueuedOperation | null>(null);
  const versionRef = useRef(0);
  const latencySamplesRef = useRef<PlainTextLatencySample[]>([]);
  const lastCursorSentAtRef = useRef(0);

  useEffect(() => {
    let isActive = true;

    setDocument(null);
    setTitle('');
    setError(null);
    setStatus('loading');

    editorService
      .getDocumentMetadata(documentId)
      .then((result) => {
        if (!isActive) {
          return;
        }

        setDocument(result.document);
        setTitle(result.document.name);
      })
      .catch((requestError) => {
        if (!isActive) {
          return;
        }

        setError(normalizeApiError(requestError).message);
        setStatus('error');
      });

    return () => {
      isActive = false;
    };
  }, [documentId]);

  const sendNextQueuedOperation = useCallback(() => {
    const websocket = wsRef.current;

    if (!websocket || websocket.readyState !== WebSocket.OPEN || inFlightRef.current) {
      return;
    }

    const next = queueRef.current.shift();

    if (!next) {
      return;
    }

    next.sendStartedAt = performance.now();
    inFlightRef.current = next;

    const message: ClientMessage = {
      base_version: versionRef.current,
      client_hash: next.clientHash,
      client_id: clientId,
      client_ts: next.clientTs,
      doc_id: documentId,
      op: next.op,
      op_id: next.opId,
      type: 'op',
    };

    websocket.send(JSON.stringify(message));
  }, [clientId, documentId]);

  const sendLocalOperation = useCallback(
    (op: TextOp, clientHash?: string) => {
      if (!canWrite) {
        return;
      }

      queueRef.current.push({
        clientHash,
        clientTs: new Date().toISOString(),
        op,
        opId: createClientId(),
        sendStartedAt: null,
      });
      setMetrics((current) => ({ ...current, sentOps: current.sentOps + 1 }));
      sendNextQueuedOperation();
    },
    [canWrite, sendNextQueuedOperation],
  );

  const sendCursor = useCallback(
    (input: { pos: number; selectionStart: number; selectionEnd: number }) => {
      const websocket = wsRef.current;
      const now = performance.now();

      if (!websocket || websocket.readyState !== WebSocket.OPEN || now - lastCursorSentAtRef.current < 35) {
        return;
      }

      lastCursorSentAtRef.current = now;

      const message: ClientMessage = {
        cursor: {
          ...localUser,
          pos: input.pos,
          selection_end: input.selectionEnd,
          selection_start: input.selectionStart,
          ts: new Date().toISOString(),
        },
        type: 'cursor',
      };

      websocket.send(JSON.stringify(message));
    },
    [localUser],
  );

  const handleAck = useCallback(
    (message: Extract<ServerMessage, { type: 'ack' }>) => {
      versionRef.current = Math.max(versionRef.current, message.server_version);
      setVersion(versionRef.current);

      const inFlight = inFlightRef.current;

      if (inFlight?.opId === message.op_id) {
        if (inFlight.sendStartedAt !== null) {
          const latencyMs = performance.now() - inFlight.sendStartedAt;
          latencySamplesRef.current = [
            ...latencySamplesRef.current.slice(-99),
            {
              latencyMs,
              opId: message.op_id,
              transformRequired: message.transform_required,
            },
          ];
          setMetrics((current) => {
            const samples = latencySamplesRef.current;
            const avg =
              samples.reduce((sum, sample) => sum + sample.latencyMs, 0) / samples.length;

            return {
              ...current,
              ackedOps: current.ackedOps + 1,
              avgAckLatencyMs: avg,
              lastAckLatencyMs: latencyMs,
              transformedOps: message.transform_required
                ? current.transformedOps + 1
                : current.transformedOps,
            };
          });
        }

        inFlightRef.current = null;
      }

      sendNextQueuedOperation();
    },
    [sendNextQueuedOperation],
  );

  const handleRemoteOperation = useCallback(
    (message: Extract<ServerMessage, { type: 'broadcast_op' }>) => {
      const remoteIdentity: OperationIdentity = {
        clientId: message.client_id,
        opId: message.op_id,
      };
      const pending = getPendingOperations(inFlightRef.current, queueRef.current);
      let operationForLocalDocument: TextOp | null = message.op;

      for (const local of pending) {
        operationForLocalDocument = operationForLocalDocument
          ? transformTextOperation(
              operationForLocalDocument,
              remoteIdentity,
              local.op,
              { clientId, opId: local.opId },
            )
          : null;
      }

      for (const queued of pending) {
        const transformed = transformTextOperation(
          queued.op,
          { clientId, opId: queued.opId },
          message.op,
          remoteIdentity,
        );

        if (transformed) {
          queued.op = transformed;
        }
      }

      versionRef.current = Math.max(versionRef.current, message.server_version);
      setVersion(versionRef.current);
      setRemoteCursors((current) => current.map((cursor) => transformCursor(cursor, message.op)));
      setMetrics((current) => ({
        ...current,
        receivedRemoteOps: current.receivedRemoteOps + 1,
      }));

      if (operationForLocalDocument) {
        setRemoteOperation({
          id: `${message.server_version}:${message.op_id}`,
          op: operationForLocalDocument,
          receivedAt: performance.now(),
          serverVersion: message.server_version,
        });
      }
    },
    [clientId],
  );

  useEffect(() => {
    const token = authTokenStorage.getToken();

    if (!token) {
      setStatus('error');
      setError('Authentication token is missing.');
      return undefined;
    }

    let shouldReconnect = true;
    let reconnectAttempt = 0;
    let reconnectTimeoutId: number | null = null;

    const scheduleReconnect = (): void => {
      if (!shouldReconnect || reconnectTimeoutId !== null) {
        return;
      }

      const delayMs = Math.min(1000 * 2 ** reconnectAttempt, 5000);
      reconnectAttempt += 1;
      setStatus('disconnected');

      reconnectTimeoutId = window.setTimeout(() => {
        reconnectTimeoutId = null;
        connect();
      }, delayMs);
    };

    const connect = (): void => {
      if (!shouldReconnect) {
        return;
      }

      const websocket = new WebSocket(buildDocumentSocketUrl(documentId, token));
      wsRef.current = websocket;
      setStatus('connecting');

      websocket.addEventListener('open', () => {
        if (wsRef.current !== websocket || !shouldReconnect) {
          return;
        }

        reconnectAttempt = 0;
        setError(null);
        const message: ClientMessage = { client_id: clientId, type: 'join' };
        websocket.send(JSON.stringify(message));
      });

      websocket.addEventListener('message', (event) => {
        if (wsRef.current !== websocket || !shouldReconnect) {
          return;
        }

        const message = JSON.parse(event.data as string) as ServerMessage;

        if (message.type === 'snapshot') {
          versionRef.current = message.version;
          queueRef.current = [];
          inFlightRef.current = null;
          setCanWrite(message.can_write);
          setContent(message.content);
          setContentSerial((current) => current + 1);
          setRemoteCursors(
            message.presence
              .filter((cursor) => cursor.client_id !== clientId)
              .map(normalizeCursorColor),
          );
          setVersion(message.version);
          setStatus('connected');
          setError(null);
          return;
        }

        if (message.type === 'ack') {
          handleAck(message);
          return;
        }

        if (message.type === 'broadcast_op') {
          handleRemoteOperation(message);
          return;
        }

        if (message.type === 'cursor') {
          if (message.cursor.client_id !== clientId) {
            setRemoteCursors((current) => upsertCursor(current, normalizeCursorColor(message.cursor)));
          }
          return;
        }

        if (message.type === 'presence') {
          setRemoteCursors(
            message.users
              .filter((cursor) => cursor.client_id !== clientId)
              .map(normalizeCursorColor),
          );
          return;
        }

        if (message.type === 'error') {
          setError(message.message);
          setStatus(message.recoverable ? 'connected' : 'error');
        }
      });

      websocket.addEventListener('close', () => {
        if (wsRef.current === websocket) {
          wsRef.current = null;
        }

        if (shouldReconnect && wsRef.current === null) {
          scheduleReconnect();
        }
      });

      websocket.addEventListener('error', () => {
        if (wsRef.current !== websocket || !shouldReconnect) {
          return;
        }

        setStatus('disconnected');
      });
    };

    setStatus('connecting');
    setError(null);
    reconnectTimeoutId = window.setTimeout(() => {
      reconnectTimeoutId = null;
      connect();
    }, 0);

    return () => {
      shouldReconnect = false;

      if (reconnectTimeoutId !== null) {
        window.clearTimeout(reconnectTimeoutId);
      }

      const websocket = wsRef.current;

      if (websocket) {
        websocket.close();
        wsRef.current = null;
      }
    };
  }, [clientId, documentId, handleAck, handleRemoteOperation]);

  const markRemoteApplied = useCallback((eventId: string) => {
    setRemoteOperation((current) => (current?.id === eventId ? null : current));
  }, []);
  const saveNow = useCallback(() => Promise.resolve(), []);

  return {
    canWrite,
    clientId,
    conflict: null,
    content,
    contentSerial,
    document,
    error,
    isLoading: status === 'loading',
    localUser,
    markRemoteApplied,
    metrics,
    remoteCursors,
    remoteOperation,
    saveNow,
    saveStatus: 'live',
    sendCursor,
    sendLocalOperation,
    status,
    syncMode: 'websocket',
    title,
    version,
  };
}

/**
 * Uses HTTP polling or GraphQL subscriptions with REST/GraphQL content saves.
 *
 * @param documentId - Workspace document identifier.
 * @param syncMode - Configured non-WebSocket synchronization mode.
 * @returns Plain-text editor state.
 */
function usePollingPlainTextEditor(
  documentId: string,
  syncMode: 'polling' | 'subscription',
): PlainTextEditorState {
  const { user } = useAuth();
  const clientId = useMemo(() => createClientId(), []);
  const localUser = useMemo<CursorState>(() => {
    const userId = user?.id ?? `anonymous-${clientId}`;

    return {
      client_id: clientId,
      color: normalizeEditorColor(user?.avatarColor, getEditorUserColor(userId)),
      display_name: user?.name ?? 'Anonymous user',
      pos: 0,
      selection_end: 0,
      selection_start: 0,
      ts: new Date().toISOString(),
      user_id: userId,
    };
  }, [clientId, user]);
  const [document, setDocument] = useState<DocumentItem | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [contentSerial, setContentSerial] = useState(0);
  const [canWrite, setCanWrite] = useState(false);
  const [version, setVersion] = useState(0);
  const [status, setStatus] = useState<PlainTextEditorState['status']>('loading');
  const [saveStatus, setSaveStatus] = useState<PlainTextEditorState['saveStatus']>('idle');
  const [conflict, setConflict] = useState<PlainTextEditorState['conflict']>(null);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<PlainTextMetrics>(emptyMetrics);
  const [subscriptionFallbackEnabled, setSubscriptionFallbackEnabled] = useState(false);
  const contentRef = useRef('');
  const revisionRef = useRef(0);
  const canWriteRef = useRef(false);
  const lastSavedContentRef = useRef('');
  const dirtyRef = useRef(false);
  const saveInFlightRef = useRef(false);

  const applyContentResult = useCallback(
    (result: DocumentContentResult, source: 'initial' | 'remote' | 'save') => {
      const isNewRemoteRevision = result.revision > revisionRef.current;

      if (source === 'remote' && dirtyRef.current) {
        if (isNewRemoteRevision) {
          setConflict({
            localRevision: revisionRef.current,
            remoteRevision: result.revision,
            updatedAt: result.updatedAt,
          });
          setSaveStatus('conflict');
        }
        setCanWrite(result.canWrite);
        canWriteRef.current = result.canWrite;
        setDocument(result.document);
        setTitle(result.document.name);
        return;
      }

      setDocument(result.document);
      setTitle(result.document.name);
      setCanWrite(result.canWrite);
      canWriteRef.current = result.canWrite;
      setVersion(result.revision);
      revisionRef.current = result.revision;
      setStatus('connected');

      if (source === 'initial' || source === 'remote') {
        setContent(result.textContent);
        contentRef.current = result.textContent;
        lastSavedContentRef.current = result.textContent;
        dirtyRef.current = false;
        setContentSerial((current) => current + 1);
        setConflict(null);
        setSaveStatus(result.canWrite ? 'saved' : 'idle');
      }

      if (source === 'save') {
        lastSavedContentRef.current = contentRef.current;
        dirtyRef.current = false;
        setConflict(null);
        setSaveStatus('saved');
      }
    },
    [],
  );

  useEffect(() => {
    let isActive = true;

    setDocument(null);
    setTitle('');
    setContent('');
    contentRef.current = '';
    setContentSerial((current) => current + 1);
    setCanWrite(false);
    canWriteRef.current = false;
    setVersion(0);
    revisionRef.current = 0;
    dirtyRef.current = false;
    setConflict(null);
    setError(null);
    setSaveStatus('idle');
    setStatus('loading');

    editorService
      .getDocumentContent(documentId)
      .then((result) => {
        if (isActive) {
          applyContentResult(result, 'initial');
        }
      })
      .catch((requestError) => {
        if (!isActive) {
          return;
        }

        setError(normalizeApiError(requestError).message);
        setStatus('error');
        setSaveStatus('error');
      });

    return () => {
      isActive = false;
    };
  }, [applyContentResult, documentId]);

  const saveNow = useCallback(async () => {
    if (!canWriteRef.current || saveInFlightRef.current || conflict) {
      return;
    }

    if (!dirtyRef.current && contentRef.current === lastSavedContentRef.current) {
      setSaveStatus('saved');
      return;
    }

    saveInFlightRef.current = true;
    setSaveStatus('saving');
    setError(null);

    try {
      const result = await editorService.updateDocumentContent({
        content: plainTextToTiptap(contentRef.current),
        documentId,
        revision: revisionRef.current,
        title,
      });
      applyContentResult(result, 'save');
    } catch (requestError) {
      const normalizedError = normalizeApiError(requestError);

      if (normalizedError.code === 'DOCUMENT_REVISION_CONFLICT' || normalizedError.statusCode === 409) {
        setConflict({
          localRevision: revisionRef.current,
          remoteRevision: revisionRef.current + 1,
          updatedAt: new Date().toISOString(),
        });
        setSaveStatus('conflict');
      } else {
        setError(normalizedError.message);
        setSaveStatus('error');
      }
    } finally {
      saveInFlightRef.current = false;
    }
  }, [applyContentResult, conflict, documentId, title]);

  const sendLocalOperation = useCallback((op: TextOp) => {
    if (!canWriteRef.current) {
      return;
    }

    const nextContent = applyTextOperation(contentRef.current, op);
    contentRef.current = nextContent;
    dirtyRef.current = true;
    setContent(nextContent);
    setSaveStatus((current) => (current === 'conflict' ? 'conflict' : 'unsaved'));
    setMetrics((current) => ({ ...current, sentOps: current.sentOps + 1 }));
  }, []);

  const sendCursor = useCallback(() => undefined, []);
  const markRemoteApplied = useCallback(() => undefined, []);

  useEffect(() => {
    if (!canWrite || conflict || !dirtyRef.current || status !== 'connected') {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      void saveNow();
    }, env.editorAutosaveDebounceMs);

    return () => window.clearTimeout(timeoutId);
  }, [canWrite, conflict, content, saveNow, status]);

  useEffect(() => {
    if (syncMode !== 'subscription' || !editorService.subscribeToDocumentContent) {
      setSubscriptionFallbackEnabled(syncMode === 'subscription');
      return undefined;
    }

    setStatus((current) => (current === 'loading' ? current : 'connecting'));

    return editorService.subscribeToDocumentContent(documentId, {
      onConnected: () => {
        setSubscriptionFallbackEnabled(false);
        setStatus('connected');
      },
      onDisconnected: () => {
        setSubscriptionFallbackEnabled(true);
        setStatus((current) => (current === 'error' ? current : 'disconnected'));
      },
      onError: (subscriptionError) => {
        setSubscriptionFallbackEnabled(true);
        setError(subscriptionError.message);
        setStatus((current) => (current === 'error' ? current : 'disconnected'));
      },
      onNext: (result) => applyContentResult(result, 'remote'),
    });
  }, [applyContentResult, documentId, syncMode]);

  useEffect(() => {
    const shouldPoll = syncMode === 'polling' || subscriptionFallbackEnabled;

    if (!shouldPoll || status === 'loading') {
      return undefined;
    }

    const poll = async (): Promise<void> => {
      try {
        const result = await editorService.getDocumentContent(documentId, { touch: false });

        if (result.revision >= revisionRef.current) {
          applyContentResult(result, 'remote');
        }
      } catch (requestError) {
        setError(normalizeApiError(requestError).message);
        setStatus('disconnected');
      }
    };

    const intervalId = window.setInterval(() => {
      void poll();
    }, env.editorPollingIntervalMs);

    return () => window.clearInterval(intervalId);
  }, [applyContentResult, documentId, status, subscriptionFallbackEnabled, syncMode]);

  return {
    canWrite,
    clientId,
    conflict,
    content,
    contentSerial,
    document,
    error,
    isLoading: status === 'loading',
    localUser,
    markRemoteApplied,
    metrics,
    remoteCursors: [],
    remoteOperation: null,
    saveNow,
    saveStatus,
    sendCursor,
    sendLocalOperation,
    status,
    syncMode,
    title,
    version,
  };
}

function buildDocumentSocketUrl(documentId: string, token: string): string {
  const baseUrl = new URL(env.collaborationUrl);
  baseUrl.pathname = `/ws/docs/${encodeURIComponent(documentId)}`;
  baseUrl.searchParams.set('token', token);
  return baseUrl.toString();
}

function createClientId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getPendingOperations(
  inFlight: QueuedOperation | null,
  queued: QueuedOperation[],
): QueuedOperation[] {
  return inFlight ? [inFlight, ...queued] : queued;
}

function upsertCursor(cursors: CursorState[], cursor: CursorState): CursorState[] {
  const next = cursors.filter((item) => item.client_id !== cursor.client_id);
  next.push(cursor);
  return next;
}

function normalizeCursorColor(cursor: CursorState): CursorState {
  return {
    ...cursor,
    color: normalizeEditorColor(cursor.color, getEditorUserColor(cursor.user_id)),
  };
}
