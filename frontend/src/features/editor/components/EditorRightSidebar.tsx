import { EditorContextSidebar } from './EditorContextSidebar';
import type { UseDocumentEditorResult } from '../types/editor.types';

/** Props for the legacy editor context-sidebar wrapper. */
export interface EditorRightSidebarProps {
  /** Editor state returned by `useDocumentEditor`. */
  state: UseDocumentEditorResult;
}

/**
 * Backward-compatible wrapper for the document context sidebar.
 *
 * The context rail now belongs on the left side of the editor, but this export
 * remains available for older imports while rendering the same compact panel.
 *
 * @param props - Legacy wrapper props.
 * @returns Workspace-style editor context sidebar.
 */
export function EditorRightSidebar({ state }: EditorRightSidebarProps): JSX.Element {
  return <EditorContextSidebar state={state} />;
}
