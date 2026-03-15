import { useDashboardStore } from "../store/dashboardStore";

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
