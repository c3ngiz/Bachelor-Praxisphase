import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  Bold,
  Heading1,
  Heading2,
  Highlighter,
  Italic,
  List,
  ListOrdered,
  Palette,
  Pilcrow,
  Redo2,
  Save,
  Type,
  Underline,
  Undo2,
} from 'lucide-react';

import { Button, Divider } from '../../../shared/components';
import { cn } from '../../../shared/utils';
import { useEditorCommands } from '../hooks/useEditorCommands';
import type {
  EditorBlockStyle,
  EditorTextAlignment,
  UseDocumentEditorResult,
} from '../types/editor.types';
import {
  editorFontFamilyOptions,
  editorFontSizeOptions,
  editorHighlightOptions,
  editorTextColorOptions,
} from '../utils/editorContent';
import { CollaborationStatusBadge } from './CollaborationStatusBadge';
import { DocumentHeader } from './DocumentHeader';
import { EditorSidebarSection } from './EditorSidebarSection';
import { SaveStatusBadge } from './SaveStatusBadge';
import { ToolbarButton } from './ToolbarButton';
import { ToolbarSelect, type ToolbarSelectOption } from './ToolbarSelect';

/** Props for the editor sidebar. */
export interface EditorSidebarProps {
  /** Editor state returned by `useDocumentEditor`. */
  state: UseDocumentEditorResult;
}

const blockStyleOptions: readonly ToolbarSelectOption[] = [
  { label: 'Paragraph', value: 'paragraph' },
  { label: 'Heading 1', value: 'heading1' },
  { label: 'Heading 2', value: 'heading2' },
];

const fontFamilyOptions: readonly ToolbarSelectOption[] = editorFontFamilyOptions;
const fontSizeOptions: readonly ToolbarSelectOption[] = [
  { label: 'Default size', value: '' },
  ...editorFontSizeOptions.map((fontSize) => ({
    label: fontSize.replace('px', ''),
    value: fontSize,
  })),
];

/**
 * Renders document metadata and grouped formatting controls in the left rail.
 *
 * @param props - Editor sidebar props.
 * @returns Workspace-style editor sidebar.
 */
export function EditorSidebar({ state }: EditorSidebarProps): JSX.Element {
  const commands = useEditorCommands({
    canEdit: state.canWrite,
    editor: state.editor,
  });
  const controlsDisabled = commands.disabled || state.isLoading;

  return (
    <aside
      className="editor-sidebar rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
      aria-label="Document editor controls"
    >
      <div className="grid gap-3">
        <Button
          className="w-full justify-start gap-2"
          onClick={() => window.location.assign('/workspace')}
          size="sm"
          variant="secondary"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Workspace
        </Button>

        <DocumentHeader
          canWrite={state.canWrite}
          document={state.document}
          isLoading={state.isLoading}
          onTitleChange={state.setTitle}
          title={state.title}
        />

        <div className="flex flex-wrap gap-1.5">
          <SaveStatusBadge lastSavedAt={state.lastSavedAt} state={state.saveState} />
          <CollaborationStatusBadge collaboration={state.collaboration} />
        </div>
      </div>

      <Divider className="my-4" />

      <div className="grid gap-4">
        <EditorSidebarSection title="Text style">
          <ToolbarSelect
            disabled={controlsDisabled}
            id="editor-block-style"
            label="Style"
            onChange={(value) => commands.setBlockStyle(value as EditorBlockStyle)}
            options={blockStyleOptions}
            value={commands.state.blockStyle}
          />
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            <ToolbarButton
              active={commands.state.blockStyle === 'paragraph'}
              disabled={controlsDisabled}
              icon={Pilcrow}
              label="Paragraph"
              onClick={() => commands.setBlockStyle('paragraph')}
            />
            <ToolbarButton
              active={commands.state.blockStyle === 'heading1'}
              disabled={controlsDisabled}
              icon={Heading1}
              label="Heading 1"
              onClick={() => commands.setBlockStyle('heading1')}
            />
            <ToolbarButton
              active={commands.state.blockStyle === 'heading2'}
              disabled={controlsDisabled}
              icon={Heading2}
              label="Heading 2"
              onClick={() => commands.setBlockStyle('heading2')}
            />
          </div>
        </EditorSidebarSection>

        <EditorSidebarSection title="Formatting">
          <div className="grid grid-cols-4 gap-1.5">
            <ToolbarButton
              active={commands.state.bold}
              disabled={controlsDisabled}
              icon={Bold}
              label="Bold"
              onClick={commands.toggleBold}
            />
            <ToolbarButton
              active={commands.state.italic}
              disabled={controlsDisabled}
              icon={Italic}
              label="Italic"
              onClick={commands.toggleItalic}
            />
            <ToolbarButton
              active={commands.state.underline}
              disabled={controlsDisabled}
              icon={Underline}
              label="Underline"
              onClick={commands.toggleUnderline}
            />
            <ToolbarButton
              active={Boolean(commands.state.highlight)}
              disabled={controlsDisabled}
              icon={Highlighter}
              label="Highlight"
              onClick={commands.toggleHighlight}
            />
          </div>
        </EditorSidebarSection>

        <EditorSidebarSection title="Alignment">
          <div className="grid grid-cols-4 gap-1.5">
            {(['left', 'center', 'right', 'justify'] as const).map((alignment) => (
              <ToolbarButton
                active={commands.state.alignment === alignment}
                disabled={controlsDisabled}
                icon={getAlignmentIcon(alignment)}
                key={alignment}
                label={`Align ${alignment}`}
                onClick={() => commands.setAlignment(alignment)}
              />
            ))}
          </div>
        </EditorSidebarSection>

        <EditorSidebarSection title="Lists">
          <div className="grid grid-cols-2 gap-1.5">
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
            <SwatchGroup
              activeValue={commands.state.textColor}
              disabled={controlsDisabled}
              icon={<Type aria-hidden="true" className="h-3.5 w-3.5" />}
              label="Text color"
              onSelect={commands.setTextColor}
              swatches={editorTextColorOptions}
              variant="text"
            />
            <SwatchGroup
              activeValue={commands.state.highlight}
              disabled={controlsDisabled}
              icon={<Palette aria-hidden="true" className="h-3.5 w-3.5" />}
              label="Highlight color"
              onSelect={commands.setHighlight}
              swatches={editorHighlightOptions}
              variant="highlight"
            />
          </div>
        </EditorSidebarSection>

        <EditorSidebarSection title="Actions">
          <div className="grid grid-cols-2 gap-1.5">
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
        </EditorSidebarSection>
      </div>
    </aside>
  );
}

interface SwatchGroupProps {
  /** Currently active color value. */
  activeValue: string;
  /** Whether swatches are disabled. */
  disabled: boolean;
  /** Small icon shown before the swatches. */
  icon: JSX.Element;
  /** Accessible group label. */
  label: string;
  /** Handles swatch selection. */
  onSelect: (value: string) => void;
  /** Available swatch values. */
  swatches: readonly { label: string; value: string }[];
  /** Visual swatch mode. */
  variant: 'highlight' | 'text';
}

function SwatchGroup({
  activeValue,
  disabled,
  icon,
  label,
  onSelect,
  swatches,
  variant,
}: SwatchGroupProps): JSX.Element {
  return (
    <div aria-label={label} className="editor-swatch-group" role="group">
      <span className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500">
        {icon}
      </span>
      {swatches.map((swatch) => {
        const isActive = activeValue === swatch.value && Boolean(swatch.value);

        return (
          <button
            aria-label={swatch.label}
            aria-pressed={isActive}
            className={cn('editor-swatch', isActive && 'editor-swatch--active')}
            disabled={disabled}
            key={`${label}-${swatch.label}`}
            onClick={() => onSelect(swatch.value)}
            style={
              variant === 'highlight'
                ? { backgroundColor: swatch.value || '#ffffff' }
                : { color: swatch.value || '#475569' }
            }
            type="button"
          >
            {swatch.value ? variant === 'text' ? 'A' : null : <span aria-hidden="true">x</span>}
          </button>
        );
      })}
    </div>
  );
}

function getAlignmentIcon(alignment: EditorTextAlignment) {
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
