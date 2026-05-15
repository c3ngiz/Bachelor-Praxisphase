import { useEffect } from 'react';

/** Options for debounced document autosave behavior. */
export interface UseDocumentAutosaveOptions {
  /** Whether autosave is allowed for the current document. */
  enabled: boolean;
  /** Whether local content has unsaved changes. */
  hasUnsavedChanges: boolean;
  /** Debounce duration in milliseconds. */
  debounceMs?: number;
  /** Saves the current editor state. */
  onSave: () => Promise<void>;
}

/**
 * Runs debounced autosave and warns before leaving with unsaved changes.
 *
 * @param options - Autosave configuration.
 */
export function useDocumentAutosave({
  debounceMs = 1200,
  enabled,
  hasUnsavedChanges,
  onSave,
}: UseDocumentAutosaveOptions): void {
  useEffect(() => {
    if (!enabled || !hasUnsavedChanges) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      void onSave().catch(() => undefined);
    }, debounceMs);

    return () => window.clearTimeout(timeoutId);
  }, [debounceMs, enabled, hasUnsavedChanges, onSave]);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent): void {
      if (!hasUnsavedChanges) {
        return;
      }

      event.preventDefault();
      event.returnValue = '';
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);
}
