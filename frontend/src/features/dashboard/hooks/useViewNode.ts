import { useDashboardStore } from "../store/dashboardStore";

/**
 * Exposes dashboard view mode state and convenience booleans.
 */
export function useViewMode() {
  const viewMode = useDashboardStore((s) => s.viewMode);
  const setViewMode = useDashboardStore((s) => s.setViewMode);

  const isGrid = viewMode === "grid";
  const isList = viewMode === "list";

  return {
    viewMode,
    isGrid,
    isList,
    setViewMode,
  };
}
