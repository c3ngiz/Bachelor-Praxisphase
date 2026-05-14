import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Extensions } from '@tiptap/core';
import { useEditor as useTiptapEditor, type Editor } from '@tiptap/react';
import BulletList from '@tiptap/extension-bullet-list';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCaret from '@tiptap/extension-collaboration-caret';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import OrderedList from '@tiptap/extension-ordered-list';
import TextAlign from '@tiptap/extension-text-align';
import FontSize from '@tiptap/extension-text-style/font-size';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import StarterKit from '@tiptap/starter-kit';
import type { HocuspocusProvider } from '@hocuspocus/provider';
import type * as Y from 'yjs';

import { useAuth } from '../../auth';
import { normalizeApiError } from '../../auth/api/authApiError';
import { A4PaginationExtension } from '../extensions/a4PaginationExtension';
import { editorService } from '../services/editorService';
import { toEditorAwarenessUser } from '../utils/editorFormatting';
import { emptyEditorContent, type EditorDocument } from '../types/editor.types';
import { useCollaboration } from './useCollaboration';
import { useDocumentAutosave } from './useDocumentAutosave';

/** Input accepted by the document editor hook. */
export interface UseDocumentEditorInput {
  /** Document identifier from the current route. */
  documentId: string | null;
}

/** Result returned by the document editor hook. */
export interface UseDocumentEditorResult {
  /** TipTap editor instance. */
  editor: Editor | null;
  /** Loaded document metadata and fallback content snapshot. */
  document: EditorDocument | null;
  /** Whether initial document metadata is loading. */
  isLoading: boolean;
  /** Combined document or collaboration error. */
  error: string | null;
  /** Whether the current user may edit content. */
  canEdit: boolean;
  /** Save status and manual save action. */
  autosave: ReturnType<typeof useDocumentAutosave>;
  /** Collaboration state for status UI. */
  collaboration: ReturnType<typeof useCollaboration>;
  /** Reloads document metadata from the selected API backend. */
  reloadDocument: () => Promise<void>;
}

/**
 * Loads document metadata and creates the collaborative TipTap editor instance.
 *
 * @param input - Hook input.
 * @returns Editor state for the document route.
 */
export function useDocumentEditor(input: UseDocumentEditorInput): UseDocumentEditorResult {
  const { user } = useAuth();
  const [document, setDocument] = useState<EditorDocument | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const awarenessUser = useMemo(() => (user ? toEditorAwarenessUser(user) : null), [user]);
  const collaboration = useCollaboration({
    documentId: input.documentId,
    enabled: Boolean(input.documentId && awarenessUser),
    user: awarenessUser,
  });
  const isCollaborative = Boolean(collaboration.provider && collaboration.ydoc);
  const canEdit = Boolean(document?.canEdit);

  const loadDocument = useCallback(async () => {
    if (!input.documentId) {
      setDocument(null);
      setLoadError('Missing document id.');
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const loadedDocument = await editorService.getDocument(input.documentId);
      setDocument(loadedDocument);
    } catch (error) {
      setLoadError(normalizeApiError(error).message);
    } finally {
      setIsLoading(false);
    }
  }, [input.documentId]);

  useEffect(() => {
    void loadDocument();
  }, [loadDocument]);

  const extensions = useMemo(
    () =>
      createEditorExtensions({
        provider: collaboration.provider,
        user: awarenessUser,
        ydoc: collaboration.ydoc,
      }),
    [awarenessUser, collaboration.provider, collaboration.ydoc],
  );

  const editor = useTiptapEditor(
    {
      content: isCollaborative ? undefined : document?.content ?? emptyEditorContent,
      editable: canEdit,
      editorProps: {
        attributes: {
          'aria-label': 'Document content',
          class: 'docflow-prosemirror',
        },
      },
      extensions,
      immediatelyRender: false,
    },
    [extensions, isCollaborative, document?.id],
  );

  useEffect(() => {
    editor?.setEditable(canEdit);
  }, [canEdit, editor]);

  useEffect(() => {
    if (!editor || !document || isCollaborative) {
      return;
    }

    editor.commands.setContent(document.content, { emitUpdate: false });
  }, [document, editor, isCollaborative]);

  const autosave = useDocumentAutosave({
    canEdit,
    collaborationStatus: collaboration.status,
    document,
    editor,
    onDocumentSaved: setDocument,
    unsyncedChanges: collaboration.unsyncedChanges,
  });

  return {
    autosave,
    canEdit,
    collaboration,
    document,
    editor,
    error: loadError ?? collaboration.error,
    isLoading,
    reloadDocument: loadDocument,
  };
}

interface CreateEditorExtensionsInput {
  /** Hocuspocus provider used for awareness and caret rendering. */
  provider: HocuspocusProvider | null;
  /** Current user awareness payload. */
  user: ReturnType<typeof toEditorAwarenessUser> | null;
  /** Yjs document used by TipTap collaboration. */
  ydoc: Y.Doc | null;
}

/**
 * Creates the TipTap extension list shared by editor instances.
 *
 * @param input - Collaboration dependencies.
 * @returns TipTap extension list.
 */
function createEditorExtensions(input: CreateEditorExtensionsInput): Extensions {
  const extensions: Extensions = [
    StarterKit.configure({
      bulletList: false,
      orderedList: false,
      undoRedo: false,
    }),
    BulletList.configure({
      keepAttributes: false,
      keepMarks: true,
    }),
    OrderedList.configure({
      keepAttributes: false,
      keepMarks: true,
    }),
    TextStyle,
    Color,
    Highlight.configure({
      multicolor: true,
    }),
    Image,
    Link.configure({
      openOnClick: false,
    }),
    Underline,
    FontFamily,
    FontSize,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    A4PaginationExtension,
  ];

  if (input.ydoc && input.provider && input.user) {
    extensions.push(
      Collaboration.configure({
        document: input.ydoc,
        field: 'default',
      }),
      CollaborationCaret.configure({
        provider: input.provider,
        user: {
          color: input.user.color,
          name: input.user.name,
        },
      }),
    );
  }

  return extensions;
}
