import { useDashboardViewControls } from "./useDashboardViewControls";

/**
 * Exposes dashboard view mode state and convenience booleans.
 */
export function useViewMode() {
  const { viewMode, setViewMode } = useDashboardViewControls();

  const isGrid = viewMode === "grid";
  const isList = viewMode === "list";

  return {
    viewMode,
    isGrid,
    isList,
    setViewMode,
  };
}
