import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  Bold,
  Highlighter,
  Italic,
  List,
  ListOrdered,
  Palette,
  Redo2,
  Save,
  Underline,
  Undo2,
} from 'lucide-react';

import { Button } from '../../../shared/components';
import { useEditorCommands } from '../hooks/useEditorCommands';
import type { EditorTextAlignment, UseDocumentEditorResult } from '../types/editor.types';
import {
  editorFontFamilyOptions,
  editorFontSizeOptions,
} from '../utils/editorContent';
import { EditorSidebarSection } from './EditorSidebarSection';
import { ToolbarButton } from './ToolbarButton';
import { ToolbarSelect, type ToolbarSelectOption } from './ToolbarSelect';

/** Props for the editor sidebar. */
export interface EditorSidebarProps {
  /** Editor state returned by `useDocumentEditor`. */
  state: UseDocumentEditorResult;
}

const fontFamilyOptions: readonly ToolbarSelectOption[] = editorFontFamilyOptions;
const fontSizeOptions: readonly ToolbarSelectOption[] = [
  { label: 'Default size', value: '' },
  ...editorFontSizeOptions.map((fontSize) => ({
    label: fontSize.replace('px', ''),
    value: fontSize,
  })),
];

/**
 * Renders grouped formatting controls in the right editor rail.
 *
 * Document identity and collaboration state are intentionally kept out of this
 * rail so editing tools stay scannable and the document canvas remains the
 * primary focus.
 *
 * @param props - Editor sidebar props.
 * @returns Workspace-style formatting sidebar.
 */
export function EditorSidebar({ state }: EditorSidebarProps): JSX.Element {
  const commands = useEditorCommands({
    canEdit: state.canWrite,
    editor: state.editor,
  });
  const controlsDisabled = commands.disabled || state.isLoading;

  return (
    <aside
      className="editor-sidebar editor-sidebar--toolbar rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
      aria-label="Document formatting controls"
    >
      <div className="grid gap-4">
        <EditorSidebarSection title="Formatting">
          <div className="grid gap-1.5">
            <ToolbarButton
              active={commands.state.bold}
              disabled={controlsDisabled}
              icon={Bold}
              label="Bold"
              onClick={commands.toggleBold}
            >
              Bold
            </ToolbarButton>
            <ToolbarButton
              active={commands.state.italic}
              disabled={controlsDisabled}
              icon={Italic}
              label="Italic"
              onClick={commands.toggleItalic}
            >
              Italic
            </ToolbarButton>
            <ToolbarButton
              active={commands.state.underline}
              disabled={controlsDisabled}
              icon={Underline}
              label="Underline"
              onClick={commands.toggleUnderline}
            >
              Underline
            </ToolbarButton>
            <ToolbarButton
              active={Boolean(commands.state.highlight)}
              disabled={controlsDisabled}
              icon={Highlighter}
              label="Highlight"
              onClick={commands.toggleHighlight}
            >
              Highlight
            </ToolbarButton>
          </div>
        </EditorSidebarSection>

        <EditorSidebarSection title="Alignment">
          <div className="grid gap-1.5">
            {(['left', 'center', 'right', 'justify'] as const).map((alignment) => (
              <ToolbarButton
                active={commands.state.alignment === alignment}
                disabled={controlsDisabled}
                icon={getAlignmentIcon(alignment)}
                key={alignment}
                label={`Align ${alignment}`}
                onClick={() => commands.setAlignment(alignment)}
              >
                {getAlignmentLabel(alignment)}
              </ToolbarButton>
            ))}
          </div>
        </EditorSidebarSection>

        <EditorSidebarSection title="Lists">
          <div className="grid gap-1.5">
            <ToolbarButton
              active={commands.state.bulletList}
              disabled={controlsDisabled}
              icon={List}
              label="Bullet list"
              onClick={commands.toggleBulletList}
            >
              Bullets
            </ToolbarButton>
            <ToolbarButton
              active={commands.state.orderedList}
              disabled={controlsDisabled}
              icon={ListOrdered}
              label="Numbered list"
              onClick={commands.toggleOrderedList}
            >
              Numbers
            </ToolbarButton>
          </div>
        </EditorSidebarSection>

        <EditorSidebarSection title="Typography">
          <div className="grid gap-2">
            <ToolbarSelect
              disabled={controlsDisabled}
              id="editor-font-family"
              label="Font"
              onChange={commands.setFontFamily}
              options={fontFamilyOptions}
              value={commands.state.fontFamily}
            />
            <ToolbarSelect
              disabled={controlsDisabled}
              id="editor-font-size"
              label="Size"
              onChange={commands.setFontSize}
              options={fontSizeOptions}
              value={commands.state.fontSize}
            />
            <ColorPickerField
              disabled={controlsDisabled}
              fallbackValue="#17202a"
              id="editor-text-color"
              label="Text color"
              onSelect={commands.setTextColor}
              value={commands.state.textColor}
            />
            <ColorPickerField
              disabled={controlsDisabled}
              fallbackValue="#fef08a"
              id="editor-highlight-color"
              label="Highlight color"
              onSelect={commands.setHighlight}
              value={commands.state.highlight}
            />
          </div>
        </EditorSidebarSection>

        <EditorSidebarSection title="Actions">
          <div className="grid gap-1.5">
            <ToolbarButton
              disabled={controlsDisabled}
              icon={Undo2}
              label="Undo"
              onClick={commands.undo}
            >
              Undo
            </ToolbarButton>
            <ToolbarButton
              disabled={controlsDisabled}
              icon={Redo2}
              label="Redo"
              onClick={commands.redo}
            >
              Redo
            </ToolbarButton>
          </div>
          <Button
            className="mt-2 w-full justify-center gap-2"
            disabled={
              !state.canWrite ||
              !state.editor ||
              state.saveState === 'saving' ||
              Boolean(state.sync.conflict)
            }
            loading={state.saveState === 'saving'}
            onClick={() => void state.saveNow().catch(() => undefined)}
            size="sm"
            title={state.sync.conflict ? 'Resolve the sync conflict before saving.' : undefined}
            variant="primary"
          >
            <Save aria-hidden="true" className="h-4 w-4" />
            Save
          </Button>
          <Button
            className="mt-2 w-full justify-center gap-2"
            onClick={() => window.location.assign('/workspace')}
            size="sm"
            variant="ghost"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to workspace
          </Button>
        </EditorSidebarSection>
      </div>
    </aside>
  );
}

interface ColorPickerFieldProps {
  /** Whether swatches are disabled. */
  disabled: boolean;
  /** Color used by the picker when the editor mark is currently cleared. */
  fallbackValue: string;
  /** Native color input identifier. */
  id: string;
  /** Accessible group label. */
  label: string;
  /** Handles color selection or clearing. */
  onSelect: (value: string) => void;
  /** Currently active color value. */
  value: string;
}

/**
 * Renders a native color picker for text or highlight color.
 *
 * @param props - Color picker props.
 * @returns Color picker command row.
 */
function ColorPickerField({
  disabled,
  fallbackValue,
  id,
  label,
  onSelect,
  value,
}: ColorPickerFieldProps): JSX.Element {
  const selectedValue = value || fallbackValue;

  return (
    <div className="editor-color-picker">
      <label className="editor-color-picker__label" htmlFor={id}>
        <Palette aria-hidden="true" className="h-4 w-4 text-slate-500" />
        <span>{label}</span>
      </label>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <input
          aria-label={label}
          className="editor-color-picker__input"
          disabled={disabled}
          id={id}
          onChange={(event) => onSelect(event.target.value)}
          type="color"
          value={selectedValue}
        />
        <Button
          disabled={disabled || !value}
          onClick={() => onSelect('')}
          size="sm"
          variant="secondary"
        >
          Clear
        </Button>
      </div>
    </div>
  );
}

/**
 * Maps an alignment value to its toolbar icon.
 *
 * @param alignment - Current alignment command value.
 * @returns Icon used by the alignment button.
 */
function getAlignmentIcon(alignment: EditorTextAlignment): typeof AlignLeft {
  if (alignment === 'center') {
    return AlignCenter;
  }

  if (alignment === 'right') {
    return AlignRight;
  }

  if (alignment === 'justify') {
    return AlignJustify;
  }

  return AlignLeft;
}

/**
 * Maps an alignment value to concise visible button text.
 *
 * @param alignment - Alignment command value.
 * @returns Button label.
 */
function getAlignmentLabel(alignment: EditorTextAlignment): string {
  if (alignment === 'center') {
    return 'Center';
  }

  if (alignment === 'right') {
    return 'Right';
  }

  if (alignment === 'justify') {
    return 'Justify';
  }

  return 'Left';
}
