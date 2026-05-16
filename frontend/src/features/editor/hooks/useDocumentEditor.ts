import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEditor } from '@tiptap/react';
import type { Editor } from '@tiptap/core';
import type { Doc } from 'yjs';

import { normalizeApiError } from '../../auth/api/authApiError';
import { useAuth } from '../../auth/hooks/useAuth';
import type { EntityId } from '../../workspace/types/workspace.types';
import { editorService } from '../services/editorService';
import { getDocumentContentVersion } from '../utils/contentVersion';
import {
  applyEditorContentSnapshot,
  createEditorExtensions,
  emptyEditorContent,
} from '../utils/editorContent';
import type { DocumentEditorLoadResult, UseDocumentEditorResult } from '../types/editor.types';
import { useCollaboration } from './useCollaboration';
import { useEditorPagination } from './useEditorPagination';
import { useEditorPollingSync } from './useEditorPollingSync';
import { useEditorSave, type EditorSavedMeta } from './useEditorSave';

/** Options accepted by the document editor hook. */
export interface UseDocumentEditorOptions {
  /** Workspace document identifier from the route. */
  documentId: EntityId;
}

/**
 * Orchestrates document loading, TipTap setup, permissions, save state, and pagination.
 *
 * Command execution, autosave, and visual page measurement live in focused
 * hooks. REST persistence remains the source of truth in polling mode: the
 * polling hook compares backend revisions, applies remote snapshots only when
 * the editor is clean, and exposes a conflict state instead of overwriting
 * unsaved local edits. The collaboration adapter can switch to Yjs transport
 * without changing route or presentational components.
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
  const [isSyncConflictActive, setIsSyncConflictActive] = useState(false);
  const applyingContentRef = useRef(false);
  const appliedEditorRef = useRef<Editor | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const canWrite = loadedContent?.canWrite ?? false;
  const currentVersion = loadedContent ? getDocumentContentVersion(loadedContent) : null;
  const enableCollaboration = collaboration.isRealtimeEnabled && Boolean(collaboration.provider);

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

  const getEditor = useCallback(() => editorRef.current, []);
  const shouldIgnoreChange = useCallback(() => applyingContentRef.current, []);
  const handleSaved = useCallback((result: DocumentEditorLoadResult, meta: EditorSavedMeta) => {
    setLoadedContent(result);

    if (!meta.hasConcurrentChanges) {
      setTitleState(result.document.name);
    }
  }, []);
  const save = useEditorSave({
    canWrite,
    documentId,
    getEditor,
    isLoading,
    onError: setError,
    onSaved: handleSaved,
    saveBlocked: isSyncConflictActive,
    shouldIgnoreChange,
    title,
  });

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
      onUpdate: save.markUnsaved,
    },
    [extensions, save.markUnsaved],
  );
  const pagination = useEditorPagination({
    editor,
    enabled: Boolean(editor && loadedContent && !isLoading),
  });

  const applyRemoteContent = useCallback(
    (result: DocumentEditorLoadResult) => {
      const currentEditor = editorRef.current;

      setLoadedContent(result);
      setTitleState(result.document.name);
      save.resetSaveTracking({
        revision: result.revision,
        updatedAt: result.updatedAt,
      });

      if (!currentEditor) {
        appliedEditorRef.current = null;
        return;
      }

      applyingContentRef.current = true;
      applyEditorContentSnapshot(currentEditor, result.content);
      currentEditor.setEditable(result.canWrite);
      appliedEditorRef.current = currentEditor;
      window.requestAnimationFrame(() => {
        applyingContentRef.current = false;
        pagination.measureNow();
      });
    },
    [pagination, save.resetSaveTracking],
  );

  const keepLocalContent = useCallback(
    (result: DocumentEditorLoadResult) => {
      const currentEditor = editorRef.current;

      setLoadedContent({
        ...result,
        content: currentEditor?.getJSON() ?? result.content,
      });
      save.adoptRemoteVersion({
        revision: result.revision,
        updatedAt: result.updatedAt,
      });
      currentEditor?.setEditable(result.canWrite);
    },
    [save.adoptRemoteVersion],
  );

  const sync = useEditorPollingSync({
    currentVersion,
    documentId,
    enabled: Boolean(
      editor &&
      loadedContent &&
      !isLoading &&
      !collaboration.isRealtimeEnabled &&
      save.saveState !== 'saving',
    ),
    hasUnsavedChanges: save.hasUnsavedChanges,
    onApplyRemoteContent: applyRemoteContent,
    onKeepLocalVersion: keepLocalContent,
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    setIsSyncConflictActive(Boolean(sync.conflict));
  }, [sync.conflict]);

  useEffect(() => {
    let isActive = true;

    setIsLoading(true);
    setError(null);
    setLoadedContent(null);
    setTitleState('');
    save.resetSaveTracking();
    appliedEditorRef.current = null;

    editorService
      .getDocumentContent(documentId)
      .then((result) => {
        if (!isActive) {
          return;
        }

        setLoadedContent(result);
        setTitleState(result.document.name);
        save.resetSaveTracking({
          revision: result.revision,
          updatedAt: result.updatedAt,
        });
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
  }, [documentId, save.resetSaveTracking]);

  useEffect(() => {
    if (!editor || !loadedContent || appliedEditorRef.current === editor) {
      return;
    }

    applyingContentRef.current = true;
    applyEditorContentSnapshot(editor, loadedContent.content);
    editor.setEditable(loadedContent.canWrite);
    appliedEditorRef.current = editor;
    window.requestAnimationFrame(() => {
      applyingContentRef.current = false;
      pagination.measureNow();
    });
  }, [editor, loadedContent, pagination]);

  useEffect(() => {
    editor?.setEditable(canWrite);
  }, [canWrite, editor]);

  const setTitle = useCallback(
    (nextTitle: string) => {
      setTitleState(nextTitle);
      save.markUnsaved();
    },
    [save.markUnsaved],
  );

  return {
    canWrite,
    collaboration,
    document: loadedContent?.document ?? null,
    editor,
    error,
    hasUnsavedChanges: save.hasUnsavedChanges,
    isLoading,
    lastSavedAt: save.lastSavedAt,
    pageCount: pagination.pageCount,
    pagination,
    saveNow: save.saveNow,
    saveState: save.saveState,
    setTitle,
    sync,
    title,
  };
}
