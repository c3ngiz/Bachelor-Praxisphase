import { HocuspocusProvider } from '@hocuspocus/provider';
import * as Y from 'yjs';

import { env } from '../../../config/env';
import type { EditorAwarenessUser } from '../types/editor.types';

/** Input for creating a document-specific collaboration provider. */
export interface CreateCollaborationProviderInput {
  /** Document identifier. */
  documentId: string;
  /** Bearer token sent to Hocuspocus authentication. */
  token: string;
  /** Local Yjs document. */
  ydoc: Y.Doc;
  /** Current user awareness payload. */
  user: EditorAwarenessUser;
  /** Called when the provider status changes. */
  onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected') => void;
  /** Called when initial sync completes. */
  onSynced?: () => void;
  /** Called when authentication fails. */
  onAuthenticationFailed?: (reason: string) => void;
  /** Called when awareness changes. */
  onAwarenessChange?: () => void;
  /** Called when unsynced local updates change. */
  onUnsyncedChanges?: (count: number) => void;
}

/**
 * Builds the Hocuspocus room name used by the backend collaboration app.
 *
 * @param documentId - Document identifier.
 * @returns Collaboration room name.
 */
export function getDocumentCollaborationRoom(documentId: string): string {
  return `document:${documentId}`;
}

/**
 * Creates a Hocuspocus provider for one document room.
 *
 * @param input - Provider creation input.
 * @returns Configured provider.
 */
export function createCollaborationProvider(
  input: CreateCollaborationProviderInput,
): HocuspocusProvider {
  return new HocuspocusProvider({
    document: input.ydoc,
    name: getDocumentCollaborationRoom(input.documentId),
    onAuthenticationFailed: ({ reason }) => input.onAuthenticationFailed?.(reason),
    onAwarenessChange: () => input.onAwarenessChange?.(),
    onAwarenessUpdate: () => input.onAwarenessChange?.(),
    onStatus: ({ status }) => input.onStatusChange?.(status),
    onSynced: () => input.onSynced?.(),
    onUnsyncedChanges: ({ number }) => input.onUnsyncedChanges?.(number),
    token: input.token,
    url: env.collaborationUrl,
  });
}
