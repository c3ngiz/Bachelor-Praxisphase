import { useCallback, useState } from 'react';
import type { EditorDraft } from '../types/editor.types';

/** Return value for editor state. */
export interface UseEditorResult {
  /** Current editable draft. */
  draft: EditorDraft;
  /** Updates the draft content. */
  updateContent: (content: string) => void;
}

/** Provides local editor state for editor screens. */
export function useEditor(): UseEditorResult {
  const [draft, setDraft] = useState<EditorDraft>({
    id: 'draft-1',
    title: 'Untitled Draft',
    content: '',
  });

  const updateContent = useCallback((content: string) => {
    setDraft((current) => ({ ...current, content }));
  }, []);

  return { draft, updateContent };
}
