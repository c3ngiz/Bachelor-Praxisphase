import type {
  HocuspocusProvider,
  onAuthenticationFailedParameters,
  onAwarenessChangeParameters,
  onStatusParameters,
  onSyncedParameters,
} from '@hocuspocus/provider';
import type { Doc } from 'yjs';

import { env } from '../../../config/env';
import { authTokenStorage } from '../../auth/api/authTokenStorage';
import type { EntityId } from '../../workspace/types/workspace.types';

/** Parameters used to create a document-scoped Hocuspocus provider. */
export interface CreateCollaborationProviderInput {
  /** Workspace document identifier. */
  documentId: EntityId;
  /** Local Yjs document to synchronize. */
  document: Doc;
  /** Receives provider status changes. */
  onStatus: (event: onStatusParameters) => void;
  /** Receives provider synced changes. */
  onSynced: (event: onSyncedParameters) => void;
  /** Receives awareness changes. */
  onAwarenessChange: (event: onAwarenessChangeParameters) => void;
  /** Receives authentication failures from the collaboration server. */
  onAuthenticationFailed: (event: onAuthenticationFailedParameters) => void;
}

/**
 * Returns whether the real-time collaboration transport should be started.
 *
 * The default remains polling because the current REST backend persists JSON
 * content but does not yet host a durable Yjs update store.
 *
 * @returns True when env flags explicitly enable Hocuspocus transport.
 */
export function shouldUseRealtimeCollaboration(): boolean {
  return env.enableRealtimeCollaboration && env.editorTransport === 'realtime';
}

/**
 * Builds the collaboration room name for one document.
 *
 * @param documentId - Workspace document identifier.
 * @returns Stable Hocuspocus room name.
 */
export function getCollaborationRoomName(documentId: EntityId): string {
  return `workspace-document:${documentId}`;
}

/**
 * Creates a Hocuspocus provider for a document room.
 *
 * @param input - Provider configuration.
 * @returns Hocuspocus provider instance.
 */
export function createCollaborationProvider(
  input: CreateCollaborationProviderInput,
): Promise<HocuspocusProvider> {
  return import('@hocuspocus/provider').then(
    ({ HocuspocusProvider }) =>
      new HocuspocusProvider({
        document: input.document,
        name: getCollaborationRoomName(input.documentId),
        onAuthenticationFailed: input.onAuthenticationFailed,
        onAwarenessChange: input.onAwarenessChange,
        onStatus: input.onStatus,
        onSynced: input.onSynced,
        token: () => authTokenStorage.getToken() ?? '',
        url: env.collaborationUrl,
      }),
  );
}
