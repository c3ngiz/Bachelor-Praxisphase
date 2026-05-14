import type { EditorDraft } from '../types/editor.types';

/** Determines whether a draft has content worth saving. */
export function canSaveDraft(draft: EditorDraft): boolean {
  return Boolean(draft.title.trim() || draft.content.trim());
}
