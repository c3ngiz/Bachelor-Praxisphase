import { useDashboardViewStore } from "../store/dashboardViewStore";

/**
 * Exposes dashboard search, sort, filter and view-mode controls.
 */
export function useDashboardViewControls() {
  const activeCollection = useDashboardViewStore((s) => s.activeCollection);
  const viewMode = useDashboardViewStore((s) => s.viewMode);
  const searchQuery = useDashboardViewStore((s) => s.searchQuery);
  const sortBy = useDashboardViewStore((s) => s.sortBy);
  const filters = useDashboardViewStore((s) => s.filters);

  const setActiveCollection = useDashboardViewStore(
    (s) => s.setActiveCollection,
  );
  const setViewMode = useDashboardViewStore((s) => s.setViewMode);
  const setSearchQuery = useDashboardViewStore((s) => s.setSearchQuery);
  const setSortBy = useDashboardViewStore((s) => s.setSortBy);
  const setFilters = useDashboardViewStore((s) => s.setFilters);
  const resetFilters = useDashboardViewStore((s) => s.resetFilters);

  return {
    activeCollection,
    viewMode,
    searchQuery,
    sortBy,
    filters,
    setActiveCollection,
    setViewMode,
    setSearchQuery,
    setSortBy,
    setFilters,
    resetFilters,
  };
}
