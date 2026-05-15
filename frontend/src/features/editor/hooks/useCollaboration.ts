import { useEffect, useMemo, useState } from 'react';
import * as Y from 'yjs';

import type { AuthUser } from '../../auth/types/auth.types';
import type { EntityId } from '../../workspace/types/workspace.types';
import {
  createCollaborationProvider,
  getCollaborationRoomName,
  shouldUseRealtimeCollaboration,
} from '../services/collaborationClient';
import { getEditorUserColor } from '../utils/editorContent';
import type {
  CollaborationConnectionState,
  CollaborationUser,
  UseCollaborationResult,
} from '../types/editor.types';

/** Options for setting up document collaboration state. */
export interface UseCollaborationOptions {
  /** Workspace document identifier. */
  documentId: EntityId;
  /** Current authenticated user. */
  user: AuthUser | null;
}

/**
 * Creates the Yjs collaboration adapter state for one document.
 *
 * The hook starts Hocuspocus only when explicit realtime env flags are set.
 * Otherwise it still returns the room name and local identity so the editor can
 * switch to real-time mode later without changing the component contract.
 *
 * @param options - Collaboration setup options.
 * @returns Collaboration connection and awareness state.
 */
export function useCollaboration({
  documentId,
  user,
}: UseCollaborationOptions): UseCollaborationResult {
  const ydoc = useMemo(() => new Y.Doc(), [documentId]);
  const roomName = useMemo(() => getCollaborationRoomName(documentId), [documentId]);
  const localUser = useMemo(
    () => createLocalCollaborationUser(documentId, user),
    [documentId, user],
  );
  const realtimeEnabled = shouldUseRealtimeCollaboration();
  const [provider, setProvider] = useState<unknown | null>(null);
  const [status, setStatus] = useState<CollaborationConnectionState>(
    realtimeEnabled ? 'connecting' : 'disabled',
  );
  const [users, setUsers] = useState<CollaborationUser[]>([]);

  useEffect(() => {
    return () => ydoc.destroy();
  }, [ydoc]);

  useEffect(() => {
    if (!realtimeEnabled) {
      setProvider(null);
      setStatus('disabled');
      setUsers([]);
      return undefined;
    }

    let isActive = true;
    let providerToDestroy: { destroy: () => void } | null = null;

    setStatus('connecting');

    void createCollaborationProvider({
      document: ydoc,
      documentId,
      onAuthenticationFailed: () => setStatus('error'),
      onAwarenessChange: (event) => setUsers(mapAwarenessUsers(event.states, localUser.id)),
      onStatus: (event) => setStatus(mapProviderStatus(event.status)),
      onSynced: (event) => setStatus(event.state ? 'synced' : 'connected'),
    })
      .then((nextProvider) => {
        if (!isActive) {
          nextProvider.destroy();
          return;
        }

        providerToDestroy = nextProvider;
        setProvider(nextProvider);
      })
      .catch(() => {
        if (isActive) {
          setStatus('error');
          setProvider(null);
        }
      });

    return () => {
      isActive = false;
      providerToDestroy?.destroy();
      setProvider(null);
      setUsers([]);
    };
  }, [documentId, localUser.id, realtimeEnabled, ydoc]);

  return {
    isRealtimeEnabled: realtimeEnabled,
    localUser,
    provider,
    roomName,
    status,
    users,
    ydoc,
  };
}

/**
 * Creates local awareness identity from auth state.
 *
 * @param documentId - Document identifier used for fallback values.
 * @param user - Authenticated user.
 * @returns Collaboration awareness user.
 */
function createLocalCollaborationUser(
  documentId: EntityId,
  user: AuthUser | null,
): CollaborationUser {
  const id = user?.id ?? `anonymous-${documentId}`;

  return {
    color: user?.avatarColor ?? getEditorUserColor(id),
    id,
    name: user?.name ?? 'Anonymous user',
  };
}

/**
 * Maps Hocuspocus provider status into editor UI state.
 *
 * @param status - Provider status string.
 * @returns Editor collaboration state.
 */
function mapProviderStatus(status: string): CollaborationConnectionState {
  if (status === 'connected') {
    return 'connected';
  }

  if (status === 'connecting') {
    return 'connecting';
  }

  return 'disconnected';
}

/**
 * Maps raw awareness states into collaboration users.
 *
 * @param states - Awareness states returned by Hocuspocus.
 * @param localUserId - Local user identifier to filter from remote list.
 * @returns Remote collaboration users.
 */
function mapAwarenessUsers(
  states: Array<Record<string | number, unknown>>,
  localUserId: EntityId,
): CollaborationUser[] {
  return states.flatMap((state) => {
      const userValue = state.user;
      const userRecord =
        typeof userValue === 'object' && userValue !== null
          ? (userValue as Record<string, unknown>)
          : state;
      const id = typeof userRecord.id === 'string' ? userRecord.id : null;
      const name = typeof userRecord.name === 'string' ? userRecord.name : null;
      const color = typeof userRecord.color === 'string' ? userRecord.color : null;
      const clientId = typeof state.clientId === 'number' ? state.clientId : undefined;

      if (!id || !name || id === localUserId) {
        return [];
      }

      const collaborationUser: CollaborationUser = {
        color: color ?? getEditorUserColor(id),
        id,
        name,
      };

      if (clientId !== undefined) {
        collaborationUser.clientId = clientId;
      }

      return [collaborationUser];
    });
}
