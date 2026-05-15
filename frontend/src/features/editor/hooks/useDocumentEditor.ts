import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEditor } from '@tiptap/react';
import type { Editor } from '@tiptap/core';
import type { Doc } from 'yjs';

import { normalizeApiError } from '../../auth/api/authApiError';
import { useAuth } from '../../auth/hooks/useAuth';
import type { EntityId } from '../../workspace/types/workspace.types';
import { editorService } from '../services/editorService';
import { createEditorExtensions, emptyEditorContent } from '../utils/editorFormatting';
import {
  calculateA4PageCount,
  measureEditorContentHeight,
} from '../utils/pagination';
import type {
  DocumentEditorLoadResult,
  DocumentSaveState,
  UseDocumentEditorResult,
} from '../types/editor.types';
import { useCollaboration } from './useCollaboration';
import { useDocumentAutosave } from './useDocumentAutosave';

/** Options accepted by the document editor hook. */
export interface UseDocumentEditorOptions {
  /** Workspace document identifier from the route. */
  documentId: EntityId;
}

/**
 * Orchestrates TipTap editor state, persistence, permissions, and pagination.
 *
 * REST persistence remains the source of truth in polling mode. Real-time
 * collaboration can be enabled later through the isolated Yjs adapter without
 * changing route or toolbar components.
 *
 * @param options - Document editor setup options.
 * @returns Editor state and commands consumed by the page shell.
 */
export function useDocumentEditor({
  documentId,
}: UseDocumentEditorOptions): UseDocumentEditorResult {
  const { user } = useAuth();
  const collaboration = useCollaboration({ documentId, user });
  const [loadedContent, setLoadedContent] = useState<DocumentEditorLoadResult | null>(null);
  const [title, setTitleState] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<DocumentSaveState>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(1);
  const revisionRef = useRef(1);
  const changeVersionRef = useRef(0);
  const savedVersionRef = useRef(0);
  const applyingContentRef = useRef(false);
  const appliedEditorRef = useRef<Editor | null>(null);
  const canWrite = loadedContent?.canWrite ?? false;
  const hasUnsavedChanges = changeVersionRef.current !== savedVersionRef.current;
  const enableCollaboration =
    collaboration.isRealtimeEnabled && Boolean(collaboration.provider);

  const extensions = useMemo(
    () =>
      createEditorExtensions({
        enableCollaboration,
        provider: collaboration.provider,
        user: collaboration.localUser,
        ydoc: collaboration.ydoc as Doc,
      }),
    [collaboration.localUser, collaboration.provider, collaboration.ydoc, enableCollaboration],
  );

  const markUnsaved = useCallback(() => {
    if (!canWrite || applyingContentRef.current) {
      return;
    }

    changeVersionRef.current += 1;
    setSaveState('unsaved');
  }, [canWrite]);

  const editor = useEditor(
    {
      content: emptyEditorContent,
      editable: false,
      editorProps: {
        attributes: {
          'aria-label': 'Document body',
          class: 'document-prosemirror',
        },
      },
      extensions,
      onUpdate: () => markUnsaved(),
    },
    [extensions],
  );

  const measurePages = useCallback(() => {
    const root = getMountedEditorDom(editor);

    if (!root) {
      setPageCount(1);
      return;
    }

    const measuredHeight = measureEditorContentHeight(root);
    setPageCount(calculateA4PageCount(measuredHeight));
  }, [editor]);

  useEffect(() => {
    let isActive = true;

    setIsLoading(true);
    setError(null);
    setLoadedContent(null);
    setTitleState('');
    setSaveState('saved');
    setLastSavedAt(null);
    setPageCount(1);
    revisionRef.current = 1;
    changeVersionRef.current = 0;
    savedVersionRef.current = 0;
    appliedEditorRef.current = null;

    editorService
      .getDocumentContent(documentId)
      .then((result) => {
        if (!isActive) {
          return;
        }

        revisionRef.current = result.revision;
        setLoadedContent(result);
        setTitleState(result.document.name);
        setLastSavedAt(result.updatedAt);
      })
      .catch((requestError) => {
        if (!isActive) {
          return;
        }

        setError(normalizeApiError(requestError).message);
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [documentId]);

  useEffect(() => {
    if (!editor || !loadedContent || appliedEditorRef.current === editor) {
      return;
    }

    applyingContentRef.current = true;
    editor.commands.setContent(loadedContent.content, { emitUpdate: false });
    editor.setEditable(loadedContent.canWrite);
    appliedEditorRef.current = editor;
    window.requestAnimationFrame(() => {
      applyingContentRef.current = false;
      measurePages();
    });
  }, [editor, loadedContent, measurePages]);

  useEffect(() => {
    editor?.setEditable(canWrite);
  }, [canWrite, editor]);

  useEffect(() => {
    const root = getMountedEditorDom(editor);

    if (!root) {
      return undefined;
    }

    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measurePages);
    const mutationObserver =
      typeof MutationObserver === 'undefined' ? null : new MutationObserver(measurePages);

    resizeObserver?.observe(root);
    mutationObserver?.observe(root, {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
    });
    editor.on('update', measurePages);
    window.requestAnimationFrame(measurePages);

    return () => {
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      editor.off('update', measurePages);
    };
  }, [editor, measurePages]);

  const saveNow = useCallback(async () => {
    if (!editor || !loadedContent || !canWrite) {
      return;
    }

    const versionAtSaveStart = changeVersionRef.current;

    setSaveState('saving');
    setError(null);

    try {
      const result = await editorService.saveDocumentContent(documentId, {
        content: editor.getJSON(),
        revision: revisionRef.current,
        title,
      });

      revisionRef.current = result.revision;
      setLoadedContent(result);
      setTitleState(result.document.name);
      setLastSavedAt(result.updatedAt);

      if (changeVersionRef.current === versionAtSaveStart) {
        savedVersionRef.current = versionAtSaveStart;
        setSaveState('saved');
      } else {
        setSaveState('unsaved');
      }
    } catch (requestError) {
      setSaveState('failed');
      setError(normalizeApiError(requestError).message);
      throw requestError;
    }
  }, [canWrite, documentId, editor, loadedContent, title]);

  const setTitle = useCallback(
    (nextTitle: string) => {
      setTitleState(nextTitle);
      markUnsaved();
    },
    [markUnsaved],
  );

  useDocumentAutosave({
    enabled: canWrite && !isLoading,
    hasUnsavedChanges,
    onSave: saveNow,
  });

  return {
    canWrite,
    collaboration,
    document: loadedContent?.document ?? null,
    editor,
    error,
    hasUnsavedChanges,
    isLoading,
    lastSavedAt,
    pageCount,
    saveNow,
    saveState,
    setTitle,
    title,
  };
}

/**
 * Safely returns the mounted ProseMirror DOM root.
 *
 * TipTap exposes a proxy before `EditorContent` creates the real view. Reading
 * `editor.view.dom` during that short window throws, so all pagination logic
 * must go through this guard.
 *
 * @param editor - TipTap editor instance.
 * @returns Mounted editor DOM root, or null while the view is not ready.
 */
function getMountedEditorDom(editor: Editor | null): HTMLElement | null {
  if (!editor || !editor.isInitialized || editor.isDestroyed) {
    return null;
  }

  try {
    return editor.view.dom as HTMLElement;
  } catch {
    return null;
  }
}
