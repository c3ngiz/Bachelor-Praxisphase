import { useCallback, useState } from 'react';

/** Backward-compatible local draft shape kept for older imports. */
export interface LegacyEditorDraft {
  /** Draft identifier. */
  id: string;
  /** Draft title. */
  title: string;
  /** Draft body content. */
  content: string;
}

/** Return value for editor state. */
export interface UseEditorResult {
  /** Current editable draft. */
  draft: LegacyEditorDraft;
  /** Updates the draft content. */
  updateContent: (content: string) => void;
}

/**
 * Provides local editor state for legacy screens.
 *
 * New document editing flows use `useDocumentEditor`; this hook is retained so
 * older imports continue to compile during the editor migration.
 */
export function useEditor(): UseEditorResult {
  const [draft, setDraft] = useState<LegacyEditorDraft>({
    id: 'draft-1',
    title: 'Untitled Draft',
    content: '',
  });

  const updateContent = useCallback((content: string) => {
    setDraft((current) => ({ ...current, content }));
  }, []);

  return { draft, updateContent };
}
