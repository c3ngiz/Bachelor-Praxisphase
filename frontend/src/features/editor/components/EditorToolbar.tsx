import { useMemo } from 'react';
import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Heading2,
  Highlighter,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Save,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react';

import { Button, Divider } from '../../../shared/components';
import type { EditorSaveStatus, EditorToolbarState } from '../types/editor.types';

const fontFamilies = [
  { label: 'Inter', value: 'Inter' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Times', value: 'Times New Roman' },
  { label: 'Mono', value: 'Courier New' },
];

const fontSizes = ['12px', '14px', '16px', '18px', '24px', '32px'];

const highlightColors = [
  { label: 'Yellow', value: '#fef08a' },
  { label: 'Green', value: '#bbf7d0' },
  { label: 'Blue', value: '#bfdbfe' },
  { label: 'Pink', value: '#fbcfe8' },
];

/** Props for the TipTap editor toolbar component. */
export interface EditorToolbarProps {
  /** TipTap editor instance. */
  editor: Editor | null;
  /** Whether formatting controls should be interactive. */
  canEdit: boolean;
  /** Current save state used to disable duplicate manual saves. */
  saveStatus: EditorSaveStatus;
  /** Manual fallback save handler. */
  onSave: () => void;
}

/** Displays rich-text controls backed by TipTap commands. */
export function EditorToolbar({
  canEdit,
  editor,
  onSave,
  saveStatus,
}: EditorToolbarProps): JSX.Element {
  const toolbarState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => getToolbarState(currentEditor),
  });
  const disabled = !editor || !canEdit;
  const state = toolbarState ?? defaultToolbarState;

  const activeTextAlign = useMemo(() => state.textAlign || 'left', [state.textAlign]);

  return (
    <div
      aria-label="Editor formatting toolbar"
      className="flex min-h-14 flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-2"
      role="toolbar"
    >
      <ToolbarButton
        active={state.bold}
        ariaLabel="Bold"
        disabled={disabled}
        icon={<Bold className="h-4 w-4" aria-hidden="true" />}
        onClick={() => editor?.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        active={state.italic}
        ariaLabel="Italic"
        disabled={disabled}
        icon={<Italic className="h-4 w-4" aria-hidden="true" />}
        onClick={() => editor?.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        active={state.underline}
        ariaLabel="Underline"
        disabled={disabled}
        icon={<UnderlineIcon className="h-4 w-4" aria-hidden="true" />}
        onClick={() => editor?.chain().focus().toggleUnderline().run()}
      />

      <Divider orientation="vertical" className="mx-1" />

      <ToolbarButton
        active={activeTextAlign === 'left'}
        ariaLabel="Align left"
        disabled={disabled}
        icon={<AlignLeft className="h-4 w-4" aria-hidden="true" />}
        onClick={() => editor?.chain().focus().setTextAlign('left').run()}
      />
      <ToolbarButton
        active={activeTextAlign === 'center'}
        ariaLabel="Align center"
        disabled={disabled}
        icon={<AlignCenter className="h-4 w-4" aria-hidden="true" />}
        onClick={() => editor?.chain().focus().setTextAlign('center').run()}
      />
      <ToolbarButton
        active={activeTextAlign === 'right'}
        ariaLabel="Align right"
        disabled={disabled}
        icon={<AlignRight className="h-4 w-4" aria-hidden="true" />}
        onClick={() => editor?.chain().focus().setTextAlign('right').run()}
      />
      <ToolbarButton
        active={activeTextAlign === 'justify'}
        ariaLabel="Justify"
        disabled={disabled}
        icon={<AlignJustify className="h-4 w-4" aria-hidden="true" />}
        onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
      />

      <Divider orientation="vertical" className="mx-1" />

      <select
        aria-label="Font family"
        className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-900 shadow-sm focus:border-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-950/10 disabled:bg-slate-50 disabled:text-slate-500"
        disabled={disabled}
        onChange={(event) => {
          const value = event.target.value;
          const chain = editor?.chain().focus();

          if (!chain) {
            return;
          }

          if (value) {
            chain.setFontFamily(value).run();
            return;
          }

          chain.unsetFontFamily().run();
        }}
        value={state.fontFamily}
      >
        <option value="">Font</option>
        {fontFamilies.map((fontFamily) => (
          <option key={fontFamily.value} value={fontFamily.value}>
            {fontFamily.label}
          </option>
        ))}
      </select>

      <select
        aria-label="Font size"
        className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-900 shadow-sm focus:border-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-950/10 disabled:bg-slate-50 disabled:text-slate-500"
        disabled={disabled}
        onChange={(event) => {
          const value = event.target.value;
          const chain = editor?.chain().focus();

          if (!chain) {
            return;
          }

          if (value) {
            chain.setFontSize(value).run();
            return;
          }

          chain.unsetFontSize().run();
        }}
        value={state.fontSize}
      >
        <option value="">Size</option>
        {fontSizes.map((fontSize) => (
          <option key={fontSize} value={fontSize}>
            {fontSize.replace('px', '')}
          </option>
        ))}
      </select>

      <select
        aria-label="Highlight color"
        className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-900 shadow-sm focus:border-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-950/10 disabled:bg-slate-50 disabled:text-slate-500"
        disabled={disabled}
        onChange={(event) => {
          const value = event.target.value;

          if (!value) {
            editor?.chain().focus().unsetHighlight().run();
            return;
          }

          editor?.chain().focus().toggleHighlight({ color: value }).run();
        }}
        value={state.highlightColor}
      >
        <option value="">Highlight</option>
        {highlightColors.map((color) => (
          <option key={color.value} value={color.value}>
            {color.label}
          </option>
        ))}
      </select>

      <Divider orientation="vertical" className="mx-1" />

      <ToolbarButton
        active={state.headingLevel === 1}
        ariaLabel="Heading 1"
        disabled={disabled}
        icon={<Heading1 className="h-4 w-4" aria-hidden="true" />}
        onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
      />
      <ToolbarButton
        active={state.headingLevel === 2}
        ariaLabel="Heading 2"
        disabled={disabled}
        icon={<Heading2 className="h-4 w-4" aria-hidden="true" />}
        onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        active={state.bulletList}
        ariaLabel="Bullet list"
        disabled={disabled}
        icon={<List className="h-4 w-4" aria-hidden="true" />}
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        active={state.orderedList}
        ariaLabel="Numbered list"
        disabled={disabled}
        icon={<ListOrdered className="h-4 w-4" aria-hidden="true" />}
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
      />

      <Divider orientation="vertical" className="mx-1" />

      <ToolbarButton
        ariaLabel="Undo"
        disabled={disabled || !editor?.can().undo()}
        icon={<Undo2 className="h-4 w-4" aria-hidden="true" />}
        onClick={() => editor?.chain().focus().undo().run()}
      />
      <ToolbarButton
        ariaLabel="Redo"
        disabled={disabled || !editor?.can().redo()}
        icon={<Redo2 className="h-4 w-4" aria-hidden="true" />}
        onClick={() => editor?.chain().focus().redo().run()}
      />
      <ToolbarButton
        active={Boolean(state.highlightColor)}
        ariaLabel="Toggle yellow highlight"
        disabled={disabled}
        icon={<Highlighter className="h-4 w-4" aria-hidden="true" />}
        onClick={() => editor?.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}
      />

      <div className="ml-auto">
        <Button
          aria-label="Save document"
          disabled={!editor || !canEdit}
          iconOnly
          loading={saveStatus === 'saving'}
          onClick={onSave}
          size="sm"
          variant="secondary"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

interface ToolbarButtonProps {
  /** Accessible button label. */
  ariaLabel: string;
  /** Whether the represented formatting state is active. */
  active?: boolean;
  /** Disabled state. */
  disabled?: boolean;
  /** Icon rendered inside the button. */
  icon: JSX.Element;
  /** Click handler. */
  onClick: () => void;
}

/** Renders one icon-only formatting button. */
function ToolbarButton({
  active = false,
  ariaLabel,
  disabled = false,
  icon,
  onClick,
}: ToolbarButtonProps): JSX.Element {
  return (
    <Button
      aria-label={ariaLabel}
      aria-pressed={active || undefined}
      className={active ? 'border-slate-950 bg-slate-100 text-slate-950' : undefined}
      disabled={disabled}
      iconOnly
      onClick={onClick}
      size="sm"
      title={ariaLabel}
      variant="ghost"
    >
      {icon}
    </Button>
  );
}

const defaultToolbarState: EditorToolbarState = {
  bold: false,
  bulletList: false,
  fontFamily: '',
  fontSize: '',
  headingLevel: null,
  highlightColor: '',
  italic: false,
  orderedList: false,
  textAlign: 'left',
  underline: false,
};

/**
 * Reads reactive toolbar state from a TipTap editor instance.
 *
 * @param editor - Current editor instance.
 * @returns Formatting state.
 */
function getToolbarState(editor: Editor | null): EditorToolbarState {
  if (!editor) {
    return defaultToolbarState;
  }

  const textStyle = editor.getAttributes('textStyle');
  const highlight = editor.getAttributes('highlight');
  const paragraph = editor.getAttributes('paragraph');
  const heading = editor.getAttributes('heading');
  const textAlign = String(paragraph.textAlign ?? heading.textAlign ?? 'left');
  const headingLevel = editor.isActive('heading', { level: 1 })
    ? 1
    : editor.isActive('heading', { level: 2 })
      ? 2
      : editor.isActive('heading', { level: 3 })
        ? 3
        : null;

  return {
    bold: editor.isActive('bold'),
    bulletList: editor.isActive('bulletList'),
    fontFamily: typeof textStyle.fontFamily === 'string' ? textStyle.fontFamily : '',
    fontSize: typeof textStyle.fontSize === 'string' ? textStyle.fontSize : '',
    headingLevel,
    highlightColor: typeof highlight.color === 'string' ? highlight.color : '',
    italic: editor.isActive('italic'),
    orderedList: editor.isActive('orderedList'),
    textAlign:
      textAlign === 'center' || textAlign === 'right' || textAlign === 'justify'
        ? textAlign
        : 'left',
    underline: editor.isActive('underline'),
  };
}
