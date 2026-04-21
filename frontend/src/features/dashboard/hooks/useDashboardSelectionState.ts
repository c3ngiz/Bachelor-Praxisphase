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

  return {
    selectedDocuments,
    toggleSelection,
    clearSelection,
  };
}
