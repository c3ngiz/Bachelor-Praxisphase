import { create } from "zustand";
import type { Document } from "../types/document.types";

type ViewMode = "grid" | "list";

interface DashboardState {
    documents: Document[];
    selectedDocuments: Set<string>;
    viewMode: ViewMode;
    searchQuery: string;

    setDocuments: (docs: Document[]) => void;
    toggleSelection: (id: string) => void;
    clearSelection: () => void;

    setViewMode: (mode: ViewMode) => void;
    setSearchQuery: (query: string) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
    documents: [],
    selectedDocuments: new Set(),

    viewMode: "grid",
    searchQuery: "",

    setDocuments: (documents) => set({ documents }),

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