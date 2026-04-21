import { create } from "zustand";

type EditorSessionState = {
  documentId: string | null;
  titleDraft: string;
  isSaving: boolean;
  lastSavedAt: string | null;
  collaboratorsConnected: number;

  startSession: (documentId: string, initialTitle: string) => void;
  setTitleDraft: (title: string) => void;
  setIsSaving: (value: boolean) => void;
  markSaved: (timestamp?: string) => void;
  setCollaboratorsConnected: (count: number) => void;
  endSession: () => void;
};

const initialState = {
  documentId: null,
  titleDraft: "",
  isSaving: false,
  lastSavedAt: null,
  collaboratorsConnected: 0,
};

export const useEditorSessionStore = create<EditorSessionState>((set) => ({
  ...initialState,

  startSession: (documentId, initialTitle) =>
    set((state) => {
      if (state.documentId === documentId) {
        return {
          ...state,
          titleDraft: initialTitle,
        };
      }

      return {
        ...initialState,
        documentId,
        titleDraft: initialTitle,
      };
    }),

  setTitleDraft: (title) => set({ titleDraft: title }),

  setIsSaving: (value) => set({ isSaving: value }),

  markSaved: (timestamp) =>
    set({
      isSaving: false,
      lastSavedAt: timestamp ?? new Date().toISOString(),
    }),

  setCollaboratorsConnected: (count) => set({ collaboratorsConnected: count }),

  endSession: () => set(initialState),
}));
