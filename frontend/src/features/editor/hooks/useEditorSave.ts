import { useCallback, useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';

import { normalizeApiError } from '../../auth/api/authApiError';
import type { EntityId } from '../../workspace/types/workspace.types';
import { editorService } from '../services/editorService';
import type {
  DocumentContentVersion,
  DocumentEditorLoadResult,
  DocumentSaveState,
  SaveDocumentContentInput,
} from '../types/editor.types';

/** Metadata passed back after a successful save. */
export interface EditorSavedMeta {
  /** Whether more local edits happened while the save request was in flight. */
  hasConcurrentChanges: boolean;
}

/** Input used when resetting save tracking after loading a document. */
export interface ResetEditorSaveTrackingInput {
  /** Backend revision for the freshly loaded document. */
  revision: number;
  /** ISO timestamp returned by the backend. */
  updatedAt: string | null;
}

/** Options accepted by the editor save hook. */
export interface UseEditorSaveOptions {
  /** Whether the current user may persist changes. */
  canWrite: boolean;
  /** Autosave debounce duration in milliseconds. */
  debounceMs?: number;
  /** Workspace document identifier. */
  documentId: EntityId;
  /** Lazily reads the current TipTap editor instance. */
  getEditor: () => Editor | null;
  /** Whether the initial document load is still pending. */
  isLoading: boolean;
  /** Whether save/autosave should wait for the user to resolve a sync conflict. */
  saveBlocked?: boolean;
  /** Receives the normalized backend response after a successful save. */
  onSaved: (result: DocumentEditorLoadResult, meta: EditorSavedMeta) => void;
  /** Receives load/save errors for the route-level alert. */
  onError: (message: string | null) => void;
  /** Returns true while persisted content is being applied programmatically. */
  shouldIgnoreChange: () => boolean;
  /** Current editable document title. */
  title: string;
}

/** State and commands returned by the editor save hook. */
export interface UseEditorSaveResult {
  /** Adopts a newer backend revision while preserving local dirty edits. */
  adoptRemoteVersion: (input: DocumentContentVersion) => void;
  /** Whether local content differs from the last acknowledged save. */
  hasUnsavedChanges: boolean;
  /** ISO timestamp of the last successful save. */
  lastSavedAt: string | null;
  /** Marks the current editor value as locally changed. */
  markUnsaved: () => void;
  /** Resets revision and dirty tracking after a document load. */
  resetSaveTracking: (input?: ResetEditorSaveTrackingInput) => void;
  /** Saves the current editor content immediately. */
  saveNow: () => Promise<void>;
  /** Current save state shown in the UI. */
  saveState: DocumentSaveState;
}

/**
 * Owns debounced autosave, manual save, revision tracking, and unload warnings.
 *
 * The hook keeps mutable editor/version values in refs so TipTap update
 * handlers do not capture stale permission or title state. Concurrent edits
 * during an in-flight save keep the editor marked as unsaved after the backend
 * acknowledges the older version. When polling reports a conflict, autosave is
 * blocked until the user either reloads the remote revision or explicitly keeps
 * the local version.
 *
 * @param options - Save setup options.
 * @returns Save state and persistence commands.
 */
export function useEditorSave({
  canWrite,
  debounceMs = 1200,
  documentId,
  getEditor,
  isLoading,
  onError,
  onSaved,
  saveBlocked = false,
  shouldIgnoreChange,
  title,
}: UseEditorSaveOptions): UseEditorSaveResult {
  const [saveState, setSaveState] = useState<DocumentSaveState>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [versionSnapshot, setVersionSnapshot] = useState({ change: 0, saved: 0 });
  const canWriteRef = useRef(canWrite);
  const changeVersionRef = useRef(0);
  const isLoadingRef = useRef(isLoading);
  const revisionRef = useRef(1);
  const saveBlockedRef = useRef(saveBlocked);
  const savedVersionRef = useRef(0);
  const titleRef = useRef(title);

  useEffect(() => {
    canWriteRef.current = canWrite;
  }, [canWrite]);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    saveBlockedRef.current = saveBlocked;
  }, [saveBlocked]);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  const publishVersionSnapshot = useCallback(() => {
    setVersionSnapshot({
      change: changeVersionRef.current,
      saved: savedVersionRef.current,
    });
  }, []);

  const resetSaveTracking = useCallback(
    (input?: ResetEditorSaveTrackingInput) => {
      revisionRef.current = input?.revision ?? 1;
      changeVersionRef.current = 0;
      savedVersionRef.current = 0;
      setLastSavedAt(input?.updatedAt ?? null);
      setSaveState('saved');
      publishVersionSnapshot();
    },
    [publishVersionSnapshot],
  );

  const markUnsaved = useCallback(() => {
    if (!canWriteRef.current || shouldIgnoreChange()) {
      return;
    }

    changeVersionRef.current += 1;
    setSaveState((currentState) => (currentState === 'saving' ? currentState : 'unsaved'));
    publishVersionSnapshot();
  }, [publishVersionSnapshot, shouldIgnoreChange]);

  const adoptRemoteVersion = useCallback(
    (input: DocumentContentVersion) => {
      revisionRef.current = input.revision;
      setLastSavedAt(input.updatedAt);

      if (changeVersionRef.current !== savedVersionRef.current) {
        setSaveState('unsaved');
      }

      publishVersionSnapshot();
    },
    [publishVersionSnapshot],
  );

  const saveNow = useCallback(async () => {
    const editor = getEditor();

    if (!editor || !canWriteRef.current || isLoadingRef.current || saveBlockedRef.current) {
      return;
    }

    const versionAtSaveStart = changeVersionRef.current;
    const input: SaveDocumentContentInput = {
      content: editor.getJSON(),
      revision: revisionRef.current,
      title: titleRef.current,
    };

    setSaveState('saving');
    onError(null);

    try {
      const result = await editorService.saveDocumentContent(documentId, input);
      const hasConcurrentChanges = changeVersionRef.current !== versionAtSaveStart;

      revisionRef.current = result.revision;
      savedVersionRef.current = versionAtSaveStart;
      setLastSavedAt(result.updatedAt);
      setSaveState(hasConcurrentChanges ? 'unsaved' : 'saved');
      publishVersionSnapshot();
      onSaved(result, { hasConcurrentChanges });
    } catch (requestError) {
      setSaveState('failed');
      publishVersionSnapshot();
      onError(normalizeApiError(requestError).message);
      throw requestError;
    }
  }, [documentId, getEditor, onError, onSaved, publishVersionSnapshot]);

  const hasUnsavedChanges = versionSnapshot.change !== versionSnapshot.saved;

  useEffect(() => {
    if (!canWrite || isLoading || saveBlocked || !hasUnsavedChanges || saveState === 'saving') {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      void saveNow().catch(() => undefined);
    }, debounceMs);

    return () => window.clearTimeout(timeoutId);
  }, [canWrite, debounceMs, hasUnsavedChanges, isLoading, saveBlocked, saveNow, saveState]);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent): void {
      if (!hasUnsavedChanges) {
        return;
      }

      event.preventDefault();
      event.returnValue = '';
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return {
    adoptRemoteVersion,
    hasUnsavedChanges,
    lastSavedAt,
    markUnsaved,
    resetSaveTracking,
    saveNow,
    saveState,
  };
}
