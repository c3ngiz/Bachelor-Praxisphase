import type { EditorAction } from '../types/editor.types';

/** Props for the editor toolbar component. */
export interface EditorToolbarProps {
  /** Toolbar action handler. */
  onAction?: (action: EditorAction) => void;
}

/** Displays reusable editor controls. */
export function EditorToolbar({ onAction }: EditorToolbarProps): JSX.Element {
  return (
    <div aria-label="Editor toolbar" role="toolbar">
      <button onClick={() => onAction?.('bold')} type="button">
        Bold
      </button>
      <button onClick={() => onAction?.('italic')} type="button">
        Italic
      </button>
      <button onClick={() => onAction?.('save')} type="button">
        Save
      </button>
    </div>
  );
}
