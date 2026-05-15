import { EditorContent } from '@tiptap/react';

import { A4Page } from './A4Page';
import type { UseDocumentEditorResult } from '../types/editor.types';

/** Props for the document canvas. */
export interface EditorCanvasProps {
  /** Editor state returned by `useDocumentEditor`. */
  state: UseDocumentEditorResult;
}

/**
 * Renders the scrollable A4 page canvas and mounted TipTap editor.
 *
 * The page backgrounds are visual only. The editable content remains one
 * ProseMirror document so lists, selection, undo/redo, and collaboration stay
 * consistent across page boundaries.
 *
 * @param props - Editor canvas props.
 * @returns Document canvas.
 */
export function EditorCanvas({ state }: EditorCanvasProps): JSX.Element {
  const isPreparingEditor = !state.isLoading && !state.error && !state.editor;

  return (
    <div
      aria-busy={state.isLoading || undefined}
      aria-label="Document pages"
      className="document-editor-canvas"
      role="region"
    >
      {state.isLoading ? (
        <CanvasMessage message="Loading document..." />
      ) : isPreparingEditor ? (
        <CanvasMessage message="Preparing editor..." />
      ) : state.error && !state.document ? (
        <div className="editor-canvas-message">
          <p className="m-0 text-sm font-medium text-slate-800">
            The document could not be loaded.
          </p>
          <p className="m-0 text-xs text-slate-500">
            Check your access and that the REST backend is running.
          </p>
        </div>
      ) : (
        <div className="editor-page-stack" style={state.pagination.pageStackStyle}>
          {state.pagination.pageIndexes.map((pageIndex) => (
            <A4Page key={pageIndex} pageIndex={pageIndex} />
          ))}
          <EditorContent
            aria-readonly={!state.canWrite}
            className="document-editor-content"
            editor={state.editor}
          />
        </div>
      )}
    </div>
  );
}

interface CanvasMessageProps {
  /** Message shown while the canvas is not editable yet. */
  message: string;
}

function CanvasMessage({ message }: CanvasMessageProps): JSX.Element {
  return (
    <div className="editor-canvas-message">
      <span
        aria-hidden="true"
        className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent"
      />
      <p className="m-0 text-sm text-slate-600">{message}</p>
    </div>
  );
}
