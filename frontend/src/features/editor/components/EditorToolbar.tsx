import { useEditorState } from '@tiptap/react';
import type { Editor } from '@tiptap/core';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Palette,
  Redo2,
  Save,
  Underline,
  Undo2,
  type LucideIcon,
} from 'lucide-react';

import { Button, Divider } from '../../../shared/components';
import { cn } from '../../../shared/utils';
import {
  editorFontFamilyOptions,
  editorFontSizeOptions,
  editorHighlightOptions,
  editorTextColorOptions,
} from '../utils/editorFormatting';
import type { DocumentSaveState } from '../types/editor.types';

/** Props accepted by the rich text toolbar. */
export interface EditorToolbarProps {
  /** TipTap editor instance. */
  editor: Editor | null;
  /** Whether formatting commands should be enabled. */
  canEdit: boolean;
  /** Current save state. */
  saveState: DocumentSaveState;
  /** Immediately persists the current document. */
  onSave: () => Promise<void>;
}

interface ToolbarState {
  /** Whether bold is active. */
  bold: boolean;
  /** Whether italic is active. */
  italic: boolean;
  /** Whether underline is active. */
  underline: boolean;
  /** Whether bullet list is active. */
  bulletList: boolean;
  /** Whether ordered list is active. */
  orderedList: boolean;
  /** Whether heading level one is active. */
  headingOne: boolean;
  /** Whether heading level two is active. */
  headingTwo: boolean;
  /** Active text alignment. */
  alignment: 'left' | 'center' | 'right' | 'justify';
  /** Active font family value. */
  fontFamily: string;
  /** Active font size value. */
  fontSize: string;
  /** Active highlight color value. */
  highlight: string;
  /** Active text color value. */
  textColor: string;
}

const defaultToolbarState: ToolbarState = {
  alignment: 'left',
  bold: false,
  bulletList: false,
  fontFamily: '',
  fontSize: '',
  headingOne: false,
  headingTwo: false,
  highlight: '',
  italic: false,
  orderedList: false,
  textColor: '',
  underline: false,
};

/**
 * Renders rich text commands for the document editor.
 *
 * @param props - Toolbar props.
 * @returns Formatting toolbar.
 */
export function EditorToolbar({
  canEdit,
  editor,
  onSave,
  saveState,
}: EditorToolbarProps): JSX.Element {
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
          bold: currentEditor.isActive('bold'),
          bulletList: currentEditor.isActive('bulletList'),
          fontFamily: typeof textStyle.fontFamily === 'string' ? textStyle.fontFamily : '',
          fontSize: typeof textStyle.fontSize === 'string' ? textStyle.fontSize : '',
          headingOne: currentEditor.isActive('heading', { level: 1 }),
          headingTwo: currentEditor.isActive('heading', { level: 2 }),
          highlight: typeof highlight.color === 'string' ? highlight.color : '',
          italic: currentEditor.isActive('italic'),
          orderedList: currentEditor.isActive('orderedList'),
          textColor: typeof textStyle.color === 'string' ? textStyle.color : '',
          underline: currentEditor.isActive('underline'),
        };
      },
    }) ?? defaultToolbarState;
  const disabled = !canEdit || !editor;

  return (
    <div
      aria-label="Document formatting toolbar"
      className="editor-toolbar"
      role="toolbar"
    >
      <ToolbarButton
        active={state.bold}
        disabled={disabled}
        icon={Bold}
        label="Bold"
        onClick={() => editor?.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        active={state.italic}
        disabled={disabled}
        icon={Italic}
        label="Italic"
        onClick={() => editor?.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        active={state.underline}
        disabled={disabled}
        icon={Underline}
        label="Underline"
        onClick={() => editor?.chain().focus().toggleUnderline().run()}
      />

      <Divider className="mx-1" orientation="vertical" />

      <ToolbarButton
        active={state.alignment === 'left'}
        disabled={disabled}
        icon={AlignLeft}
        label="Align left"
        onClick={() => editor?.chain().focus().setTextAlign('left').run()}
      />
      <ToolbarButton
        active={state.alignment === 'center'}
        disabled={disabled}
        icon={AlignCenter}
        label="Align center"
        onClick={() => editor?.chain().focus().setTextAlign('center').run()}
      />
      <ToolbarButton
        active={state.alignment === 'right'}
        disabled={disabled}
        icon={AlignRight}
        label="Align right"
        onClick={() => editor?.chain().focus().setTextAlign('right').run()}
      />
      <ToolbarButton
        active={state.alignment === 'justify'}
        disabled={disabled}
        icon={AlignJustify}
        label="Justify"
        onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
      />

      <Divider className="mx-1" orientation="vertical" />

      <label className="sr-only" htmlFor="editor-font-family">
        Font family
      </label>
      <select
        className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-900 focus:border-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-950/10 disabled:bg-slate-50 disabled:text-slate-500"
        disabled={disabled}
        id="editor-font-family"
        onChange={(event) => {
          const value = event.target.value;
          if (!value) {
            editor?.chain().focus().unsetFontFamily().run();
            return;
          }
          editor?.chain().focus().setFontFamily(value).run();
        }}
        value={state.fontFamily}
      >
        {editorFontFamilyOptions.map((option) => (
          <option key={option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <label className="sr-only" htmlFor="editor-font-size">
        Font size
      </label>
      <select
        className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-900 focus:border-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-950/10 disabled:bg-slate-50 disabled:text-slate-500"
        disabled={disabled}
        id="editor-font-size"
        onChange={(event) => {
          const value = event.target.value;
          if (!value) {
            editor?.chain().focus().unsetFontSize().run();
            return;
          }
          editor?.chain().focus().setFontSize(value).run();
        }}
        value={state.fontSize}
      >
        <option value="">Size</option>
        {editorFontSizeOptions.map((fontSize) => (
          <option key={fontSize} value={fontSize}>
            {fontSize.replace('px', '')}
          </option>
        ))}
      </select>

      <div aria-label="Text color" className="editor-swatch-group" role="group">
        <Palette aria-hidden="true" className="h-4 w-4 text-slate-500" />
        {editorTextColorOptions.map((option) => (
          <button
            key={option.label}
            aria-label={option.label}
            className={cn(
              'editor-swatch',
              state.textColor === option.value && option.value && 'editor-swatch--active',
            )}
            disabled={disabled}
            onClick={() => {
              if (!option.value) {
                editor?.chain().focus().unsetColor().run();
                return;
              }
              editor?.chain().focus().setColor(option.value).run();
            }}
            style={{ color: option.value || '#475569' }}
            type="button"
          >
            {option.value ? 'A' : <span aria-hidden="true">x</span>}
          </button>
        ))}
      </div>

      <div aria-label="Highlight color" className="editor-swatch-group" role="group">
        {editorHighlightOptions.map((option) => (
          <button
            key={option.label}
            aria-label={option.label}
            className={cn(
              'editor-swatch',
              state.highlight === option.value && option.value && 'editor-swatch--active',
            )}
            disabled={disabled}
            onClick={() => {
              if (!option.value) {
                editor?.chain().focus().unsetHighlight().run();
                return;
              }
              editor?.chain().focus().setHighlight({ color: option.value }).run();
            }}
            style={{ backgroundColor: option.value || '#ffffff' }}
            type="button"
          >
            {!option.value ? <span aria-hidden="true">x</span> : null}
          </button>
        ))}
      </div>

      <Divider className="mx-1" orientation="vertical" />

      <ToolbarButton
        active={state.bulletList}
        disabled={disabled}
        icon={List}
        label="Bullet list"
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        active={state.orderedList}
        disabled={disabled}
        icon={ListOrdered}
        label="Numbered list"
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        active={state.headingOne}
        disabled={disabled}
        icon={Heading1}
        label="Heading 1"
        onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
      />
      <ToolbarButton
        active={state.headingTwo}
        disabled={disabled}
        icon={Heading2}
        label="Heading 2"
        onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
      />

      <Divider className="mx-1" orientation="vertical" />

      <ToolbarButton
        active={false}
        disabled={disabled}
        icon={Undo2}
        label="Undo"
        onClick={() => editor?.chain().focus().undo().run()}
      />
      <ToolbarButton
        active={false}
        disabled={disabled}
        icon={Redo2}
        label="Redo"
        onClick={() => editor?.chain().focus().redo().run()}
      />

      <Button
        className="ml-auto"
        disabled={!canEdit || !editor || saveState === 'saving'}
        loading={saveState === 'saving'}
        onClick={() => void onSave().catch(() => undefined)}
        size="sm"
        variant="secondary"
      >
        <Save aria-hidden="true" className="h-4 w-4" />
        Save
      </Button>
    </div>
  );
}

interface ToolbarButtonProps {
  /** Whether the represented command is active. */
  active: boolean;
  /** Whether the button is disabled. */
  disabled: boolean;
  /** Icon rendered inside the button. */
  icon: LucideIcon;
  /** Accessible command label. */
  label: string;
  /** Executes the editor command. */
  onClick: () => void;
}

/**
 * Renders a single icon-only toolbar button.
 *
 * @param props - Toolbar button props.
 * @returns Toolbar command button.
 */
function ToolbarButton({
  active,
  disabled,
  icon: Icon,
  label,
  onClick,
}: ToolbarButtonProps): JSX.Element {
  return (
    <Button
      aria-label={label}
      className={cn('editor-toolbar-button', active && 'editor-toolbar-button--active')}
      disabled={disabled}
      iconOnly
      onClick={onClick}
      size="sm"
      title={label}
      variant="secondary"
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
    </Button>
  );
}

/**
 * Reads the current text alignment from the active selection.
 *
 * @param editor - TipTap editor instance.
 * @returns Active toolbar alignment value.
 */
function getActiveAlignment(editor: Editor): ToolbarState['alignment'] {
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
