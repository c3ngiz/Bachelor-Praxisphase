import { useCallback } from 'react';
import type { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';

import type {
  EditorBlockStyle,
  EditorCommandApi,
  EditorTextAlignment,
  EditorToolbarState,
} from '../types/editor.types';

/** Options accepted by the editor command hook. */
export interface UseEditorCommandsOptions {
  /** Whether commands should be enabled for the current user. */
  canEdit: boolean;
  /** TipTap editor instance. */
  editor: Editor | null;
}

const defaultToolbarState: EditorToolbarState = {
  alignment: 'left',
  blockStyle: 'paragraph',
  bold: false,
  bulletList: false,
  fontFamily: '',
  fontSize: '',
  highlight: '',
  italic: false,
  orderedList: false,
  textColor: '',
  underline: false,
};

/**
 * Converts TipTap's command chain into a small typed facade for toolbar UI.
 *
 * Components consume this hook instead of embedding TipTap calls inline. That
 * keeps active-state derivation close to the editor library while allowing the
 * sidebar controls to remain mostly presentational.
 *
 * @param options - Command setup options.
 * @returns Selection state and formatting commands.
 */
export function useEditorCommands({
  canEdit,
  editor,
}: UseEditorCommandsOptions): EditorCommandApi {
  const state =
    useEditorState({
      editor,
      selector: ({ editor: currentEditor }) => {
        if (!currentEditor) {
          return defaultToolbarState;
        }

        const textStyle = currentEditor.getAttributes('textStyle');
        const highlight = currentEditor.getAttributes('highlight');

        return {
          alignment: getActiveAlignment(currentEditor),
          blockStyle: getActiveBlockStyle(currentEditor),
          bold: currentEditor.isActive('bold'),
          bulletList: currentEditor.isActive('bulletList'),
          fontFamily: typeof textStyle.fontFamily === 'string' ? textStyle.fontFamily : '',
          fontSize: typeof textStyle.fontSize === 'string' ? textStyle.fontSize : '',
          highlight: typeof highlight.color === 'string' ? highlight.color : '',
          italic: currentEditor.isActive('italic'),
          orderedList: currentEditor.isActive('orderedList'),
          textColor: typeof textStyle.color === 'string' ? textStyle.color : '',
          underline: currentEditor.isActive('underline'),
        };
      },
    }) ?? defaultToolbarState;
  const disabled = !canEdit || !editor;

  const runCommand = useCallback(
    (command: (currentEditor: Editor) => void) => {
      if (!editor || disabled) {
        return;
      }

      command(editor);
    },
    [disabled, editor],
  );

  const setBlockStyle = useCallback(
    (blockStyle: EditorBlockStyle) =>
      runCommand((currentEditor) => {
        if (blockStyle === 'heading1') {
          currentEditor.chain().focus().setHeading({ level: 1 }).run();
          return;
        }

        if (blockStyle === 'heading2') {
          currentEditor.chain().focus().setHeading({ level: 2 }).run();
          return;
        }

        currentEditor.chain().focus().setParagraph().run();
      }),
    [runCommand],
  );
  const toggleBold = useCallback(
    () => runCommand((currentEditor) => currentEditor.chain().focus().toggleBold().run()),
    [runCommand],
  );
  const toggleItalic = useCallback(
    () => runCommand((currentEditor) => currentEditor.chain().focus().toggleItalic().run()),
    [runCommand],
  );
  const toggleUnderline = useCallback(
    () => runCommand((currentEditor) => currentEditor.chain().focus().toggleUnderline().run()),
    [runCommand],
  );
  const toggleHighlight = useCallback(
    () =>
      runCommand((currentEditor) => {
        if (currentEditor.isActive('highlight')) {
          currentEditor.chain().focus().unsetHighlight().run();
          return;
        }

        currentEditor.chain().focus().setHighlight({ color: '#fef08a' }).run();
      }),
    [runCommand],
  );
  const setAlignment = useCallback(
    (alignment: EditorTextAlignment) =>
      runCommand((currentEditor) => currentEditor.chain().focus().setTextAlign(alignment).run()),
    [runCommand],
  );
  const toggleBulletList = useCallback(
    () => runCommand((currentEditor) => currentEditor.chain().focus().toggleBulletList().run()),
    [runCommand],
  );
  const toggleOrderedList = useCallback(
    () => runCommand((currentEditor) => currentEditor.chain().focus().toggleOrderedList().run()),
    [runCommand],
  );
  const setFontFamily = useCallback(
    (fontFamily: string) =>
      runCommand((currentEditor) => {
        if (!fontFamily) {
          currentEditor.chain().focus().unsetFontFamily().run();
          return;
        }

        currentEditor.chain().focus().setFontFamily(fontFamily).run();
      }),
    [runCommand],
  );
  const setFontSize = useCallback(
    (fontSize: string) =>
      runCommand((currentEditor) => {
        if (!fontSize) {
          currentEditor.chain().focus().unsetFontSize().run();
          return;
        }

        currentEditor.chain().focus().setFontSize(fontSize).run();
      }),
    [runCommand],
  );
  const setTextColor = useCallback(
    (color: string) =>
      runCommand((currentEditor) => {
        if (!color) {
          currentEditor.chain().focus().unsetColor().run();
          return;
        }

        currentEditor.chain().focus().setColor(color).run();
      }),
    [runCommand],
  );
  const setHighlight = useCallback(
    (color: string) =>
      runCommand((currentEditor) => {
        if (!color) {
          currentEditor.chain().focus().unsetHighlight().run();
          return;
        }

        currentEditor.chain().focus().setHighlight({ color }).run();
      }),
    [runCommand],
  );
  const undo = useCallback(
    () => runCommand((currentEditor) => currentEditor.chain().focus().undo().run()),
    [runCommand],
  );
  const redo = useCallback(
    () => runCommand((currentEditor) => currentEditor.chain().focus().redo().run()),
    [runCommand],
  );

  return {
    disabled,
    redo,
    setAlignment,
    setBlockStyle,
    setFontFamily,
    setFontSize,
    setHighlight,
    setTextColor,
    state,
    toggleBold,
    toggleBulletList,
    toggleHighlight,
    toggleItalic,
    toggleOrderedList,
    toggleUnderline,
    undo,
  };
}

/**
 * Reads the current text alignment from the active selection.
 *
 * @param editor - TipTap editor instance.
 * @returns Active toolbar alignment value.
 */
function getActiveAlignment(editor: Editor): EditorTextAlignment {
  if (editor.isActive({ textAlign: 'center' })) {
    return 'center';
  }

  if (editor.isActive({ textAlign: 'right' })) {
    return 'right';
  }

  if (editor.isActive({ textAlign: 'justify' })) {
    return 'justify';
  }

  return 'left';
}

/**
 * Reads the active block style from the current selection.
 *
 * @param editor - TipTap editor instance.
 * @returns Sidebar block style value.
 */
function getActiveBlockStyle(editor: Editor): EditorBlockStyle {
  if (editor.isActive('heading', { level: 1 })) {
    return 'heading1';
  }

  if (editor.isActive('heading', { level: 2 })) {
    return 'heading2';
  }

  return 'paragraph';
}
