import { create } from "zustand";

type ViewMode = "grid" | "list";

interface DashboardState {
    selectedDocuments: Set<string>;
    viewMode: ViewMode;
    searchQuery: string;

    toggleSelection: (id: string) => void;
    clearSelection: () => void;

    setViewMode: (mode: ViewMode) => void;
    setSearchQuery: (query: string) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
    selectedDocuments: new Set(),

    viewMode: "grid",
    searchQuery: "",

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
}));