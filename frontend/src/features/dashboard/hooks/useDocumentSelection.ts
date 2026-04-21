import { useDashboardSelectionState } from "./useDashboardSelectionState";

/**
 * Provides selection state helpers for dashboard document views.
 */
export function useDocumentSelection() {
  const { selectedDocuments, toggleSelection, clearSelection } =
    useDashboardSelectionState();

  const isSelected = (id: string) => {
    return selectedDocuments.has(id);
  };

  const selectedCount = selectedDocuments.size;

  return {
    selectedDocuments,
    selectedCount,
    isSelected,
    toggleSelection,
    clearSelection,
  };
}
