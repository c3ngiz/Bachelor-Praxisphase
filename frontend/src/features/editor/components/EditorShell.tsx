import { ArrowLeft } from 'lucide-react';
import { EditorContent } from '@tiptap/react';
import type { CSSProperties } from 'react';

import { Badge, Button } from '../../../shared/components';
import { calculateA4PageStackHeight } from '../utils/pagination';
import { A4Page } from './A4Page';
import { CollaborationStatus } from './CollaborationStatus';
import { EditorToolbar } from './EditorToolbar';
import { SaveStatus } from './SaveStatus';
import type { UseDocumentEditorResult } from '../types/editor.types';

/** Props for the document editor shell. */
export interface EditorShellProps {
  /** Editor state returned by `useDocumentEditor`. */
  state: UseDocumentEditorResult;
}

/**
 * Renders the full document editor surface: title, toolbar, canvas, and pages.
 *
 * @param props - Shell props.
 * @returns Document editor UI.
 */
export function EditorShell({ state }: EditorShellProps): JSX.Element {
  const pageIndexes = Array.from({ length: state.pageCount }, (_, index) => index);
  const pageStackStyle = {
    minHeight: `${calculateA4PageStackHeight(state.pageCount)}px`,
  } satisfies CSSProperties;
  const isPreparingEditor = !state.isLoading && !state.error && !state.editor;

  return (
    <section className="tiptap-editor editor-shell">
      <div className="editor-titlebar">
        <Button
          aria-label="Back to workspace"
          className="gap-2"
          onClick={() => window.location.assign('/workspace')}
          size="sm"
          variant="secondary"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Workspace
        </Button>

        <div className="min-w-0 flex-1">
          <label className="sr-only" htmlFor="document-title">
            Document title
          </label>
          <input
            aria-label="Document title"
            className="editor-title-input"
            disabled={!state.canWrite}
            id="document-title"
            onChange={(event) => state.setTitle(event.target.value)}
            value={state.title}
          />
          <p className="m-0 text-xs text-slate-500">
            {state.document?.owner.name ? `Owner: ${state.document.owner.name}` : 'Document'}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {!state.canWrite && !state.isLoading ? <Badge>Read only</Badge> : null}
          <SaveStatus lastSavedAt={state.lastSavedAt} state={state.saveState} />
          <CollaborationStatus collaboration={state.collaboration} />
        </div>
      </div>

      <EditorToolbar
        canEdit={state.canWrite}
        editor={state.editor}
        onSave={state.saveNow}
        saveState={state.saveState}
      />

      {state.error ? (
        <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {state.error}
        </div>
      ) : null}

      <div
        aria-busy={state.isLoading || undefined}
        aria-label="Document pages"
        className="document-editor-canvas"
        role="region"
      >
        {state.isLoading ? (
          <div className="editor-canvas-message">
            <span
              aria-hidden="true"
              className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent"
            />
            <p className="m-0 text-sm text-slate-600">Loading document...</p>
          </div>
        ) : isPreparingEditor ? (
          <div className="editor-canvas-message">
            <span
              aria-hidden="true"
              className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent"
            />
            <p className="m-0 text-sm text-slate-600">Preparing editor...</p>
          </div>
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
          <div className="editor-page-stack" style={pageStackStyle}>
            {pageIndexes.map((pageIndex) => (
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
    </section>
  );
}
