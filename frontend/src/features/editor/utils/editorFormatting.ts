import type { Extensions, JSONContent } from '@tiptap/core';
import { Collaboration } from '@tiptap/extension-collaboration';
import { CollaborationCaret } from '@tiptap/extension-collaboration-caret';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import { Highlight } from '@tiptap/extension-highlight';
import { TextAlign } from '@tiptap/extension-text-align';
import { FontSize } from '@tiptap/extension-text-style/font-size';
import { TextStyle } from '@tiptap/extension-text-style/text-style';
import { StarterKit } from '@tiptap/starter-kit';
import type { Doc } from 'yjs';

import type { CollaborationUser, EditorDocumentContent } from '../types/editor.types';

/** Empty TipTap document used before persisted content is loaded. */
export const emptyEditorContent: EditorDocumentContent = {
  content: [{ type: 'paragraph' }],
  type: 'doc',
};

/** Font families exposed by the editor toolbar. */
export const editorFontFamilyOptions = [
  { label: 'Default', value: '' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
] as const;

/** Font sizes exposed by the editor toolbar. */
export const editorFontSizeOptions = [
  '10px',
  '11px',
  '12px',
  '14px',
  '16px',
  '18px',
  '24px',
  '32px',
] as const;

/** Highlight swatches exposed by the editor toolbar. */
export const editorHighlightOptions = [
  { label: 'Yellow highlight', value: '#fef08a' },
  { label: 'Green highlight', value: '#bbf7d0' },
  { label: 'Blue highlight', value: '#bfdbfe' },
  { label: 'Pink highlight', value: '#fbcfe8' },
  { label: 'Clear highlight', value: '' },
] as const;

/** Text color swatches exposed by the editor toolbar. */
export const editorTextColorOptions = [
  { label: 'Slate text', value: '#17202a' },
  { label: 'Gray text', value: '#475569' },
  { label: 'Blue text', value: '#2563eb' },
  { label: 'Green text', value: '#15803d' },
  { label: 'Red text', value: '#dc2626' },
  { label: 'Clear text color', value: '' },
] as const;

/** Options accepted when composing the TipTap extension list. */
export interface CreateEditorExtensionsOptions {
  /** Local Yjs document used when collaboration mode is active. */
  ydoc?: Doc | null;
  /** Hocuspocus-compatible provider used for remote sync and awareness. */
  provider?: unknown | null;
  /** Local user shown in remote cursor awareness. */
  user: CollaborationUser;
  /** Whether to install Yjs collaboration extensions. */
  enableCollaboration: boolean;
}

/**
 * Creates the editor extension list for polling and real-time modes.
 *
 * TipTap's collaboration extension owns undo/redo through Yjs, so StarterKit's
 * undoRedo extension is disabled only when the collaboration stack is active.
 *
 * @param options - Collaboration-aware extension options.
 * @returns TipTap extensions used by the document editor.
 */
export function createEditorExtensions(options: CreateEditorExtensionsOptions): Extensions {
  const extensions: Extensions = [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
      undoRedo: options.enableCollaboration ? false : undefined,
    }),
    TextStyle,
    Color,
    FontSize,
    FontFamily,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
  ];

  if (options.enableCollaboration && options.ydoc && options.provider) {
    extensions.push(
      Collaboration.configure({
        document: options.ydoc,
      }),
      CollaborationCaret.configure({
        provider: options.provider,
        user: options.user,
      }),
    );
  }

  return extensions;
}

/**
 * Normalizes unknown backend JSON into a safe TipTap document.
 *
 * @param value - Raw backend value.
 * @returns Valid-enough TipTap JSON for editor initialization.
 */
export function normalizeEditorContent(value: unknown): EditorDocumentContent {
  if (isRecord(value) && value.type === 'doc') {
    return value as JSONContent;
  }

  return emptyEditorContent;
}

/**
 * Derives a stable collaboration color from a user or document identifier.
 *
 * @param value - Stable input string.
 * @returns Hex color used by cursor awareness.
 */
export function getEditorUserColor(value: string): string {
  const palette = ['#0f766e', '#7c3aed', '#b45309', '#0369a1', '#be123c', '#15803d'];
  const hash = Array.from(value).reduce((sum, character) => sum + character.charCodeAt(0), 0);

  return palette[hash % palette.length];
}

/**
 * Checks whether an unknown value is an object record.
 *
 * @param value - Unknown value to inspect.
 * @returns True when the value is a non-array object.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
