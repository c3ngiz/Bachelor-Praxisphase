import { useDashboardSelectionStore } from "../store/dashboardSelectionStore";

/**
 * Exposes dashboard selection state and selection actions.
 */
export function useDashboardSelectionState() {
  const selectedDocuments = useDashboardSelectionStore(
    (s) => s.selectedDocuments,
  );
  const toggleSelection = useDashboardSelectionStore((s) => s.toggleSelection);
  const clearSelection = useDashboardSelectionStore((s) => s.clearSelection);

  const selectedCount = selectedDocuments.size;

  const isSelected = (id: string) => {
    return selectedDocuments.has(id);
  };

  return {
    selectedDocuments,
    selectedCount,
    isSelected,
    toggleSelection,
    clearSelection,
  };
}
