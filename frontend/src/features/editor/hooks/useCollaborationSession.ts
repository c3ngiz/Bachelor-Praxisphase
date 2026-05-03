import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { IndexeddbPersistence } from "y-indexeddb";
import * as Y from "yjs";

import type { User } from "@/features/auth";
import { useEditorSessionStore } from "../store/editorSessionStore";
import { COLLABORATION_WS_URL } from "../config/collaborationConfig";
import type {
  CollaborationPresenceUser,
  SyncConnectionState,
} from "../services/documentSync";

type UseCollaborationSessionInput = {
  documentId: string | undefined;
  token: string | null;
  user: User | null;
  enabled: boolean;
};

const tailwindColorMap: Record<string, string> = {
  "bg-emerald-500": "#10b981",
  "bg-violet-500": "#8b5cf6",
  "bg-indigo-500": "#6366f1",
  "bg-sky-500": "#0ea5e9",
  "bg-rose-500": "#f43f5e",
  "bg-amber-500": "#f59e0b",
};

function toCssColor(color: string | undefined): string {
  if (!color) return "#4943be";
  if (color.startsWith("#") || color.startsWith("rgb") || color.startsWith("hsl")) {
    return color;
  }

  return tailwindColorMap[color] ?? "#4943be";
}

function getPresenceUsers(
  provider: HocuspocusProvider,
  currentUserId: string,
): CollaborationPresenceUser[] {
  const users: CollaborationPresenceUser[] = [];

  for (const state of provider.awareness?.getStates().values() ?? []) {
      const awarenessUser = state.user as
        | {
            id?: string;
            name?: string;
            initials?: string;
            color?: string;
          }
        | undefined;

      if (!awarenessUser?.id || awarenessUser.id === currentUserId) {
        continue;
      }

      users.push({
        id: awarenessUser.id,
        name: awarenessUser.name ?? "Collaborator",
        initials: awarenessUser.initials ?? "?",
        color: awarenessUser.color ?? "#4943be",
        isTyping: Boolean(state.isTyping),
      });
  }

  return users;
}

export function useCollaborationSession({
  documentId,
  token,
  user,
  enabled,
}: UseCollaborationSessionInput) {
  const [document, setDocument] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [presenceUsers, setPresenceUsers] = useState<CollaborationPresenceUser[]>([]);
  const [connectionState, setConnectionState] =
    useState<SyncConnectionState>("disconnected");
  const typingTimerRef = useRef<number | null>(null);
  const setCollaboratorsConnected = useEditorSessionStore(
    (state) => state.setCollaboratorsConnected,
  );

  const collaborationUser = useMemo(() => {
    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      initials: user.initials,
      color: toCssColor(user.avatarColor),
    };
  }, [user]);

  useEffect(() => {
    setCollaboratorsConnected(presenceUsers.length);
  }, [presenceUsers.length, setCollaboratorsConnected]);

  useEffect(() => {
    if (!enabled || !documentId || !token || !collaborationUser) {
      setDocument(null);
      setProvider(null);
      setPresenceUsers([]);
      setConnectionState("disconnected");
      return;
    }

    const ydoc = new Y.Doc();
    const persistence = new IndexeddbPersistence(`docflow:${documentId}`, ydoc);
    const hocuspocusProvider = new HocuspocusProvider({
      url: COLLABORATION_WS_URL,
      name: `document:${documentId}`,
      document: ydoc,
      token,
      onStatus: ({ status }) => {
        setConnectionState(
          status === "connected"
            ? "connected"
            : status === "connecting"
              ? "polling"
              : "disconnected",
        );
      },
      onAuthenticationFailed: () => {
        setConnectionState("error");
      },
      onAwarenessChange: () => {
        setPresenceUsers(getPresenceUsers(hocuspocusProvider, collaborationUser.id));
      },
    });

    hocuspocusProvider.setAwarenessField("user", collaborationUser);
    setDocument(ydoc);
    setProvider(hocuspocusProvider);

    return () => {
      if (typingTimerRef.current !== null) {
        window.clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }

      void persistence.destroy();
      hocuspocusProvider.destroy();
      ydoc.destroy();
      setPresenceUsers([]);
      setConnectionState("disconnected");
    };
  }, [collaborationUser, documentId, enabled, token]);

  const markTyping = useCallback(() => {
    if (!provider) return;

    provider.setAwarenessField("isTyping", true);

    if (typingTimerRef.current !== null) {
      window.clearTimeout(typingTimerRef.current);
    }

    typingTimerRef.current = window.setTimeout(() => {
      typingTimerRef.current = null;
      provider.setAwarenessField("isTyping", false);
    }, 1400);
  }, [provider]);

  return {
    collaborationUser,
    connectionState,
    document,
    markTyping,
    presenceUsers,
    provider,
  };
}
