/** Editable document draft state. */
export interface EditorDraft {
  /** Draft identifier. */
  id: string;
  /** Draft title. */
  title: string;
  /** Draft body content. */
  content: string;
}

/** Supported editor toolbar actions. */
export type EditorAction = 'bold' | 'italic' | 'save';
