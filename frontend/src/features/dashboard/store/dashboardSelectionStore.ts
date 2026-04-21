import { create } from "zustand";

export type DashboardSelectionState = {
  selectedDocuments: Set<string>;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
};

/**
 * Stores selected document ids for dashboard multi-select interactions.
 */
export const useDashboardSelectionStore = create<DashboardSelectionState>(
  (set) => ({
    selectedDocuments: new Set(),

    toggleSelection: (id) =>
      set((state) => {
        const selected = new Set(state.selectedDocuments);

        if (selected.has(id)) {
          selected.delete(id);
        } else {
          selected.add(id);
        }

        return { selectedDocuments: selected };
      }),

    clearSelection: () => set({ selectedDocuments: new Set() }),
  }),
);
