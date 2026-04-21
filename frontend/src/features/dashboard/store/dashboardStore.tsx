import {
    type DashboardFilters,
    useDashboardViewStore,
} from "./dashboardViewStore";
import { useDashboardSelectionStore } from "./dashboardSelectionStore";

export type SortOption = ReturnType<typeof useDashboardViewStore.getState>["sortBy"];

type DashboardState = ReturnType<typeof useDashboardViewStore.getState> &
    ReturnType<typeof useDashboardSelectionStore.getState>;

/**
 * Backward-compatible facade combining split dashboard stores.
 */
export function useDashboardStore<T>(selector: (state: DashboardState) => T): T {
    const viewState = useDashboardViewStore();
    const selectionState = useDashboardSelectionStore();

    return selector({
        ...viewState,
        ...selectionState,
    });
}

export type { DashboardFilters };