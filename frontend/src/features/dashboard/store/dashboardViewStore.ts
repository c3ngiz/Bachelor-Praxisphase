import { create } from "zustand";

import {
  DEFAULT_DOCUMENT_FILTERS,
  type DocumentFilters,
  type DocumentSortOption,
} from "@/features/documents";
import type { DashboardCollectionId } from "../utils/dashboardCollections";

export type DashboardViewMode = "grid" | "list";
export type DashboardSortOption = DocumentSortOption;
export type DashboardFilters = DocumentFilters;

export type DashboardViewState = {
  activeCollection: DashboardCollectionId;
  viewMode: DashboardViewMode;
  searchQuery: string;
  sortBy: DashboardSortOption;
  filters: DashboardFilters;
  setActiveCollection: (collection: DashboardCollectionId) => void;
  setViewMode: (mode: DashboardViewMode) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: DashboardSortOption) => void;
  setFilters: (filters: Partial<DashboardFilters>) => void;
  resetFilters: () => void;
};

const defaultFilters: DashboardFilters = DEFAULT_DOCUMENT_FILTERS;

/**
 * Stores dashboard view controls such as view mode, search, sort and filters.
 */
export const useDashboardViewStore = create<DashboardViewState>((set) => ({
  activeCollection: "all",
  viewMode: "grid",
  searchQuery: "",
  sortBy: "updated",
  filters: defaultFilters,

  setActiveCollection: (activeCollection) => set({ activeCollection }),

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
