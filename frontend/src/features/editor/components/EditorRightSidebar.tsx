import { CollaborationPanel } from './CollaborationPanel';
import type { UseDocumentEditorResult } from '../types/editor.types';

/** Props for the editor collaboration sidebar. */
export interface EditorRightSidebarProps {
  /** Editor state returned by `useDocumentEditor`. */
  state: UseDocumentEditorResult;
}

/**
 * Renders the right rail for collaboration and document sync details.
 *
 * @param props - Right sidebar props.
 * @returns Workspace-style right editor sidebar.
 */
export function EditorRightSidebar({ state }: EditorRightSidebarProps): JSX.Element {
  return (
    <aside
      aria-label="Document collaboration information"
      className="editor-sidebar editor-sidebar--right rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
    >
      <CollaborationPanel state={state} />
    </aside>
  );
}
