import { create } from "zustand";

type ViewMode = "grid" | "list";
export type SortOption = "updated" | "created" | "title";

export type DashboardFilters = {
    author: string;
    onlyEmpty: boolean;
    onlyRecentlyOpened: boolean;
};

interface DashboardState {
    selectedDocuments: Set<string>;
    viewMode: ViewMode;
    searchQuery: string;
    sortBy: SortOption;
    filters: DashboardFilters;

    toggleSelection: (id: string) => void;
    clearSelection: () => void;

    setViewMode: (mode: ViewMode) => void;
    setSearchQuery: (query: string) => void;
    setSortBy: (sort: SortOption) => void;
    setFilters: (filters: Partial<DashboardFilters>) => void;
    resetFilters: () => void;
}

const defaultFilters: DashboardFilters = {
    author: "all",
    onlyEmpty: false,
    onlyRecentlyOpened: false,
};

export const useDashboardStore = create<DashboardState>((set) => ({
    selectedDocuments: new Set(),

    viewMode: "grid",
    searchQuery: "",
    sortBy: "updated",
    filters: defaultFilters,

    toggleSelection: (id) =>
        set((state) => {
            const selected = new Set(state.selectedDocuments);

            if (selected.has(id)) selected.delete(id);
            else selected.add(id);

            return { selectedDocuments: selected };
        }),

    clearSelection: () => set({ selectedDocuments: new Set() }),

    setViewMode: (viewMode) => set({ viewMode }),

    setSearchQuery: (searchQuery) => set({ searchQuery }),

    setSortBy: (sortBy) => set({ sortBy }),

    setFilters: (filters) =>
        set((state) => ({
            filters: {
                ...state.filters,
                ...filters,
            },
        })),

    resetFilters: () => set({ filters: defaultFilters }),
}));