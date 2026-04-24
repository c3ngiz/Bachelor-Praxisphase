import { create } from "zustand";

import {
  createWorkspaceRequest,
  inviteWorkspaceMemberRequest,
  listWorkspaces,
} from "../api/workspacesApi";
import type {
  CreateWorkspaceInput,
  InviteWorkspaceMemberInput,
  Workspace,
} from "../types/workspace.types";

type WorkspacesState = {
  activeWorkspaceId: string | null;
  error: string | null;
  isLoading: boolean;
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  loadWorkspaces: (token: string) => Promise<void>;
  setActiveWorkspaceId: (workspaceId: string) => void;
  createWorkspace: (
    input: CreateWorkspaceInput,
    token: string,
  ) => Promise<Workspace>;
  inviteMember: (
    workspaceId: string,
    input: InviteWorkspaceMemberInput,
    token: string,
  ) => Promise<Workspace>;
  clearWorkspaces: () => void;
  clearError: () => void;
};

function getInitialWorkspaceId(
  workspaces: Workspace[],
  currentActiveId: string | null,
): string | null {
  if (currentActiveId && workspaces.some((workspace) => workspace.id === currentActiveId)) {
    return currentActiveId;
  }

  return (
    workspaces.find((workspace) => workspace.isDefault)?.id ??
    workspaces[0]?.id ??
    null
  );
}

function replaceWorkspace(workspaces: Workspace[], incoming: Workspace): Workspace[] {
  const index = workspaces.findIndex((workspace) => workspace.id === incoming.id);

  if (index === -1) {
    return [...workspaces, incoming];
  }

  const next = [...workspaces];
  next[index] = incoming;
  return next;
}

export const useWorkspacesStore = create<WorkspacesState>((set, get) => ({
  activeWorkspaceId: null,
  error: null,
  isLoading: false,
  workspaces: [],
  activeWorkspace: null,

  clearError: () => set({ error: null }),

  clearWorkspaces: () =>
    set({
      activeWorkspace: null,
      activeWorkspaceId: null,
      error: null,
      workspaces: [],
    }),

  setActiveWorkspaceId: (activeWorkspaceId) =>
    set((state) => ({
      activeWorkspaceId,
      activeWorkspace:
        state.workspaces.find((workspace) => workspace.id === activeWorkspaceId) ??
        null,
    })),

  loadWorkspaces: async (token) => {
    set({ isLoading: true, error: null });

    try {
      const response = await listWorkspaces(token);
      const activeWorkspaceId = getInitialWorkspaceId(
        response.workspaces,
        get().activeWorkspaceId,
      );

      set({
        activeWorkspaceId,
        activeWorkspace:
          response.workspaces.find((workspace) => workspace.id === activeWorkspaceId) ??
          null,
        isLoading: false,
        workspaces: response.workspaces,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load workspaces.";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  createWorkspace: async (input, token) => {
    try {
      const response = await createWorkspaceRequest(input, token);
      const workspaces = replaceWorkspace(get().workspaces, response.workspace);

      set({
        activeWorkspaceId: response.workspace.id,
        activeWorkspace: response.workspace,
        error: null,
        workspaces,
      });

      return response.workspace;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create workspace.";
      set({ error: message });
      throw error;
    }
  },

  inviteMember: async (workspaceId, input, token) => {
    try {
      const response = await inviteWorkspaceMemberRequest(workspaceId, input, token);
      const workspaces = replaceWorkspace(get().workspaces, response.workspace);

      set((state) => ({
        activeWorkspace:
          state.activeWorkspaceId === response.workspace.id
            ? response.workspace
            : state.activeWorkspace,
        error: null,
        workspaces,
      }));

      return response.workspace;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to invite workspace member.";
      set({ error: message });
      throw error;
    }
  },
}));
