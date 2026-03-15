import { useDashboardStore } from "../store/dashboardStore";

export function useDocumentSelection() {
  const selectedDocuments = useDashboardStore((s) => s.selectedDocuments);
  const toggleSelection = useDashboardStore((s) => s.toggleSelection);
  const clearSelection = useDashboardStore((s) => s.clearSelection);

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
