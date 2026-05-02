import { useCallback, useEffect, useRef, useState } from "react";
import {
  createGraphqlSubscriptionClient,
  createRestPollingClient,
  createWebSocketClient,
  type DocumentUpdateEvent,
  type PresenceUser,
  type RemoteCursor,
  type SyncClient,
  type SyncConnectionState,
  type SyncMetricsEvent,
  type SyncMode,
} from "../services/documentSync";
import {
  normalizeDocument,
  type Document,
  useDocumentsStore,
} from "@/features/documents";
import { useEditorSessionStore } from "../store/editorSessionStore";

type UseDocumentSyncSessionInput = {
  documentId: string | undefined;
  token: string | null;
  syncMode: SyncMode;
  pollIntervalMs: number;
  localRevision: number;
  onRevisionChange: (revision: number) => void;
  onTitleChange: (title: string) => void;
  onMetric: (event: SyncMetricsEvent) => void;
};

function upsertDocument(documents: Document[], incoming: Document): Document[] {
  const normalizedDocument = normalizeDocument(incoming);
  const index = documents.findIndex((doc) => doc.id === normalizedDocument.id);

  if (index === -1) {
    return [normalizedDocument, ...documents];
  }

  const nextDocuments = [...documents];
  nextDocuments[index] = normalizedDocument;
  return nextDocuments;
}

function upsertPresenceUsers(
  currentUsers: PresenceUser[],
  incomingUsers: PresenceUser[],
): PresenceUser[] {
  const usersById = new Map(currentUsers.map((user) => [user.id, user]));

  for (const user of incomingUsers) {
    usersById.set(user.id, user);
  }

  return Array.from(usersById.values());
}

export function useDocumentSyncSession({
  documentId,
  token,
  syncMode,
  pollIntervalMs,
  localRevision,
  onRevisionChange,
  onTitleChange,
  onMetric,
}: UseDocumentSyncSessionInput) {
  const revisionRef = useRef(localRevision);
  const connectionIdRef = useRef(0);
  const clientRef = useRef<SyncClient | null>(null);
  const setCollaboratorsConnected = useEditorSessionStore(
    (state) => state.setCollaboratorsConnected,
  );
  const [connectionState, setConnectionState] =
    useState<SyncConnectionState>("disconnected");
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([]);

  useEffect(() => {
    revisionRef.current = localRevision;
  }, [localRevision]);

  useEffect(() => {
    setCollaboratorsConnected(presenceUsers.length);
  }, [presenceUsers.length, setCollaboratorsConnected]);

  const applyDocumentEvent = useCallback(
    (event: DocumentUpdateEvent) => {
      const incomingDocument = normalizeDocument(event.document);

      if (incomingDocument.revision < revisionRef.current) {
        return;
      }

      revisionRef.current = incomingDocument.revision;
      onRevisionChange(incomingDocument.revision);
      onTitleChange(incomingDocument.title);
      useDocumentsStore.setState((state) => ({
        documents: upsertDocument(state.documents, incomingDocument),
      }));
    },
    [onRevisionChange, onTitleChange],
  );

  const sendCursor = useCallback((anchor: number, head: number) => {
    clientRef.current?.sendCursor(anchor, head);
  }, []);

  useEffect(() => {
    connectionIdRef.current += 1;
    const connectionId = connectionIdRef.current;

    if (!documentId || !token) {
      setConnectionState("disconnected");
      setPresenceUsers([]);
      setRemoteCursors([]);
      return;
    }

    const setActiveConnectionState = (state: SyncConnectionState) => {
      if (connectionIdRef.current === connectionId) {
        setConnectionState(state);
      }
    };
    const recordActiveMetric = (event: SyncMetricsEvent) => {
      if (connectionIdRef.current === connectionId) {
        onMetric(event);
      }
    };
    const setActivePresenceUsers = (users: PresenceUser[]) => {
      if (connectionIdRef.current !== connectionId) {
        return;
      }

      setPresenceUsers((currentUsers) => upsertPresenceUsers(currentUsers, users));
    };
    const setActiveRemoteCursor = (cursor: RemoteCursor) => {
      if (connectionIdRef.current !== connectionId) {
        return;
      }

      setRemoteCursors((currentCursors) => {
        const withoutCurrentUser = currentCursors.filter(
          (item) => item.user.id !== cursor.user.id,
        );
        return [...withoutCurrentUser, cursor];
      });
      setActivePresenceUsers([cursor.user]);
    };
    const removeActivePresenceUser = (userId: string) => {
      if (connectionIdRef.current !== connectionId) {
        return;
      }

      setPresenceUsers((currentUsers) =>
        currentUsers.filter((user) => user.id !== userId),
      );
      setRemoteCursors((currentCursors) =>
        currentCursors.filter((cursor) => cursor.user.id !== userId),
      );
    };

    setPresenceUsers([]);
    setRemoteCursors([]);

    const options = {
      documentId,
      token,
      pollIntervalMs,
      getLocalRevision: () => revisionRef.current,
      onDocumentEvent: applyDocumentEvent,
      onMetric: recordActiveMetric,
      onPresenceUsers: setActivePresenceUsers,
      onRemoteCursor: setActiveRemoteCursor,
      onPresenceLeft: removeActivePresenceUser,
      onStatus: setActiveConnectionState,
    };
    const client =
      syncMode === "rest-polling"
        ? createRestPollingClient(options)
        : syncMode === "graphql-subscription"
          ? createGraphqlSubscriptionClient(options)
          : createWebSocketClient(options);

    clientRef.current = client;
    client.connect();

    return () => {
      client.disconnect();

      if (clientRef.current === client) {
        clientRef.current = null;
      }
    };
  }, [
    applyDocumentEvent,
    documentId,
    onMetric,
    pollIntervalMs,
    syncMode,
    token,
  ]);

  return {
    applyDocumentEvent,
    connectionState,
    presenceUsers,
    remoteCursors,
    sendCursor,
  };
}
