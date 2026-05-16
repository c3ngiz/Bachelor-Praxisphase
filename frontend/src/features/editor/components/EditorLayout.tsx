import { EditorContextSidebar } from './EditorContextSidebar';
import { EditorCanvas } from './EditorCanvas';
import { EditorSidebar } from './EditorSidebar';
import type { UseDocumentEditorResult } from '../types/editor.types';

/** Props for the editor page layout. */
export interface EditorLayoutProps {
  /** Editor state returned by `useDocumentEditor`. */
  state: UseDocumentEditorResult;
}

/**
 * Provides the responsive workspace-style layout for the document editor.
 *
 * @param props - Editor layout props.
 * @returns Left context sidebar, central document canvas, and right toolbar sidebar.
 */
export function EditorLayout({ state }: EditorLayoutProps): JSX.Element {
  return (
    <section className="document-editor-page" aria-label="Document editor">
      <div className="document-editor-page__context-sidebar">
        <EditorContextSidebar state={state} />
      </div>
      <div className="document-editor-page__main">
        {state.error ? (
          <div
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {state.error}
          </div>
        ) : null}
        <EditorCanvas state={state} />
      </div>
      <div className="document-editor-page__toolbar-sidebar">
        <EditorSidebar state={state} />
      </div>
    </section>
  );
}
