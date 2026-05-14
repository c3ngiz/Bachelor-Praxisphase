import { useCallback, useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';

import { normalizeApiError } from '../../auth/api/authApiError';
import { editorService } from '../services/editorService';
import type {
  EditorCollaborationStatus,
  EditorDocument,
  EditorSaveStatus,
} from '../types/editor.types';

/** Input accepted by the document autosave hook. */
export interface UseDocumentAutosaveInput {
  /** TipTap editor instance. */
  editor: Editor | null;
  /** Loaded document metadata. */
  document: EditorDocument | null;
  /** Whether the current user may save. */
  canEdit: boolean;
  /** Current collaboration status. */
  collaborationStatus: EditorCollaborationStatus;
  /** Provider unsynced update count. */
  unsyncedChanges: number;
  /** Called when fallback save returns a newer document revision. */
  onDocumentSaved: (document: EditorDocument) => void;
}

/** Result returned by the document autosave hook. */
export interface UseDocumentAutosaveResult {
  /** Current save status. */
  saveStatus: EditorSaveStatus;
  /** Last save error, if any. */
  saveError: string | null;
  /** Manually saves the current editor JSON through REST or GraphQL. */
  saveNow: () => Promise<void>;
}

/**
 * Tracks collaborative autosave state and exposes a manual fallback save.
 *
 * Hocuspocus persists Yjs updates on the backend using its debounced
 * `onStoreDocument` hook. The frontend therefore observes local update and
 * provider-sync state instead of POSTing every keystroke as JSON.
 *
 * @param input - Hook input.
 * @returns Save state and manual save action.
 */
export function useDocumentAutosave(
  input: UseDocumentAutosaveInput,
): UseDocumentAutosaveResult {
  const [saveStatus, setSaveStatus] = useState<EditorSaveStatus>('saved');
  const [saveError, setSaveError] = useState<string | null>(null);
  const idleTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!input.editor || !input.canEdit) {
      return undefined;
    }

    const handleUpdate = (): void => {
      setSaveStatus('unsaved');
      setSaveError(null);

      if (idleTimer.current !== null) {
        window.clearTimeout(idleTimer.current);
      }

      idleTimer.current = window.setTimeout(() => {
        setSaveStatus('saving');
      }, 600);
    };

    input.editor.on('update', handleUpdate);

    return () => {
      input.editor?.off('update', handleUpdate);

      if (idleTimer.current !== null) {
        window.clearTimeout(idleTimer.current);
      }
    };
  }, [input.canEdit, input.editor]);

  useEffect(() => {
    if (!input.canEdit) {
      setSaveStatus('saved');
      return;
    }

    if (input.unsyncedChanges > 0) {
      setSaveStatus('saving');
      return;
    }

    if (
      input.collaborationStatus === 'connected' ||
      input.collaborationStatus === 'synced'
    ) {
      setSaveStatus('saved');
    }
  }, [input.canEdit, input.collaborationStatus, input.unsyncedChanges]);

  const saveNow = useCallback(async () => {
    if (!input.editor || !input.document || !input.canEdit) {
      return;
    }

    setSaveStatus('saving');
    setSaveError(null);

    try {
      const savedDocument = await editorService.updateDocument({
        content: input.editor.getJSON(),
        documentId: input.document.id,
        expectedRevision: input.document.revision,
        title: input.document.title,
      });
      input.onDocumentSaved(savedDocument);
      setSaveStatus('saved');
    } catch (error) {
      const normalizedError = normalizeApiError(error);
      setSaveError(normalizedError.message);
      setSaveStatus('failed');
    }
  }, [input]);

  return { saveError, saveNow, saveStatus };
}
