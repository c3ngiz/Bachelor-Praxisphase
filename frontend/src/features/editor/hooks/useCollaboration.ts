import { useEffect, useMemo, useState } from 'react';
import type { HocuspocusProvider } from '@hocuspocus/provider';
import * as Y from 'yjs';

import { authTokenStorage } from '../../auth/api/authTokenStorage';
import {
  createCollaborationProvider,
  getDocumentCollaborationRoom,
} from '../services/collaborationClient';
import type {
  EditorAwarenessUser,
  EditorCollaborationStatus,
} from '../types/editor.types';

/** Input accepted by the collaboration hook. */
export interface UseCollaborationInput {
  /** Document identifier used as the collaboration room suffix. */
  documentId: string | null;
  /** Current user awareness payload. */
  user: EditorAwarenessUser | null;
  /** Whether the hook should open a WebSocket connection. */
  enabled: boolean;
}

/** Collaboration state returned to the editor feature. */
export interface UseCollaborationResult {
  /** Hocuspocus provider for TipTap collaboration extensions. */
  provider: HocuspocusProvider | null;
  /** Local Yjs document shared with TipTap. */
  ydoc: Y.Doc | null;
  /** Current transport status. */
  status: EditorCollaborationStatus;
  /** Active remote collaborators from awareness. */
  users: EditorAwarenessUser[];
  /** Number of unsynced local Yjs updates known by the provider. */
  unsyncedChanges: number;
  /** Collaboration room name for diagnostics. */
  roomName: string | null;
  /** Human-readable collaboration error. */
  error: string | null;
}

/**
 * Opens and manages a document-scoped Hocuspocus/Yjs collaboration session.
 *
 * @param input - Hook input.
 * @returns Collaboration provider, Yjs document, presence users, and status.
 */
export function useCollaboration(input: UseCollaborationInput): UseCollaborationResult {
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const [status, setStatus] = useState<EditorCollaborationStatus>('idle');
  const [users, setUsers] = useState<EditorAwarenessUser[]>([]);
  const [unsyncedChanges, setUnsyncedChanges] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const roomName = useMemo(
    () => (input.documentId ? getDocumentCollaborationRoom(input.documentId) : null),
    [input.documentId],
  );

  useEffect(() => {
    if (!input.enabled || !input.documentId || !input.user) {
      setProvider(null);
      setYdoc(null);
      setStatus('idle');
      setUsers([]);
      setUnsyncedChanges(0);
      setError(null);
      return undefined;
    }

    const token = authTokenStorage.getToken();

    if (!token) {
      setStatus('failed');
      setError('Missing authentication token for collaboration.');
      return undefined;
    }

    const nextYdoc = new Y.Doc();
    setStatus('connecting');
    setError(null);

    const nextProvider = createCollaborationProvider({
      documentId: input.documentId,
      onAuthenticationFailed: (reason) => {
        setStatus('failed');
        setError(reason || 'Collaboration authentication failed.');
      },
      onAwarenessChange: () => {
        setUsers(readRemoteAwarenessUsers(nextProvider, input.user?.id));
      },
      onStatusChange: (nextStatus) => {
        setStatus(
          nextStatus === 'connected'
            ? 'connected'
            : nextStatus === 'disconnected'
              ? 'disconnected'
              : 'connecting',
        );
      },
      onSynced: () => {
        setStatus('synced');
        setUsers(readRemoteAwarenessUsers(nextProvider, input.user?.id));
      },
      onUnsyncedChanges: setUnsyncedChanges,
      token,
      user: input.user,
      ydoc: nextYdoc,
    });

    nextProvider.setAwarenessField('user', input.user);
    setYdoc(nextYdoc);
    setProvider(nextProvider);

    return () => {
      nextProvider.destroy();
      nextYdoc.destroy();
      setProvider(null);
      setYdoc(null);
      setUsers([]);
      setUnsyncedChanges(0);
    };
  }, [input.documentId, input.enabled, input.user]);

  return {
    error,
    provider,
    roomName,
    status,
    unsyncedChanges,
    users,
    ydoc,
  };
}

/**
 * Reads remote awareness users from a Hocuspocus provider.
 *
 * @param provider - Hocuspocus provider.
 * @param localUserId - Current local user id excluded from the result.
 * @returns Remote awareness users.
 */
function readRemoteAwarenessUsers(
  provider: HocuspocusProvider,
  localUserId: string | undefined,
): EditorAwarenessUser[] {
  const states = Array.from(provider.awareness?.getStates().values() ?? []);
  const users: EditorAwarenessUser[] = [];

  for (const state of states) {
    const user = readAwarenessUser(state);

    if (user && user.id !== localUserId && !users.some((item) => item.id === user.id)) {
      users.push(user);
    }
  }

  return users;
}

/**
 * Parses one awareness state object.
 *
 * @param state - Unknown awareness state.
 * @returns Awareness user or null.
 */
function readAwarenessUser(state: unknown): EditorAwarenessUser | null {
  if (!state || typeof state !== 'object') {
    return null;
  }

  const record = state as Record<string, unknown>;
  const user = record.user;

  if (!user || typeof user !== 'object') {
    return null;
  }

  const userRecord = user as Record<string, unknown>;
  const id = userRecord.id;
  const name = userRecord.name;
  const color = userRecord.color;
  const initials = userRecord.initials;

  if (typeof id !== 'string' || typeof name !== 'string' || typeof color !== 'string') {
    return null;
  }

  return {
    color,
    id,
    initials: typeof initials === 'string' ? initials : undefined,
    name,
  };
}
