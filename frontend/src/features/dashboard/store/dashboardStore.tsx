import { create } from "zustand";
import {
    DEFAULT_DOCUMENT_FILTERS,
    type DocumentFilters,
    type DocumentSortOption,
} from "@/features/documents";

type ViewMode = "grid" | "list";
export type SortOption = DocumentSortOption;
export type DashboardFilters = DocumentFilters;

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

const defaultFilters: DashboardFilters = DEFAULT_DOCUMENT_FILTERS;

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