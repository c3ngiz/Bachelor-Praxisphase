import { CollaborationPanel } from './CollaborationPanel';
import type { UseDocumentEditorResult } from '../types/editor.types';

/** Props for the editor context sidebar. */
export interface EditorContextSidebarProps {
  /** Editor state returned by `useDocumentEditor`. */
  state: UseDocumentEditorResult;
}

/**
 * Renders the left rail for document identity, sync, and collaboration context.
 *
 * @param props - Context sidebar props.
 * @returns Workspace-style editor context sidebar.
 */
export function EditorContextSidebar({ state }: EditorContextSidebarProps): JSX.Element {
  return (
    <aside
      aria-label="Document context and collaboration"
      className="editor-sidebar editor-sidebar--context rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
    >
      <CollaborationPanel state={state} />
    </aside>
  );
}
