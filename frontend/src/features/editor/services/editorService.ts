import type { EditorDraft } from '../types/editor.types';

/** Service facade for editor workflows. */
export const editorService = {
  /** Returns a mocked saved draft. */
  async saveDraft(draft: EditorDraft): Promise<EditorDraft> {
    return draft;
  },
};
