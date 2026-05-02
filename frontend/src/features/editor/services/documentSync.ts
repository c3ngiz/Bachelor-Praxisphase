import { API_URL } from "@/shared/lib/api";
import type { Document } from "@/features/documents";

export type SyncMode = "rest-polling" | "websocket" | "graphql-subscription";

export type SyncConnectionState =
  | "connected"
  | "disconnected"
  | "polling"
  | "reconnecting"
  | "error";

export type PresenceUser = {
  id: string;
  name: string;
  initials: string;
  color: string;
};

export type RemoteCursor = {
  user: PresenceUser;
  anchor: number;
  head: number;
  updatedAt: string;
};

export type DocumentUpdateEvent = {
  type: "document.updated";
  documentId: string;
  version: number;
  userId: string;
  timestamp: string;
  operation: {
    kind: string;
    [key: string]: unknown;
  };
  document: Document;
};

export type SyncMetricsEvent =
  | { type: "request"; mode: SyncMode; timestamp: string }
  | { type: "sent"; mode: SyncMode; sentAt: string }
  | { type: "received"; mode: SyncMode; sentAt?: string; receivedAt: string }
  | {
      type: "conflict";
      mode: SyncMode;
      timestamp: string;
      expectedRevision?: number;
      actualRevision?: number;
    }
  | {
      type: "mode-switch";
      mode: SyncMode;
      timestamp: string;
      note?: string;
    }
  | {
      type: "connection";
      mode: SyncMode;
      timestamp: string;
      connectionState: SyncConnectionState;
      note?: string;
    };

export type SyncClient = {
  connect: () => void;
  disconnect: () => void;
  sendCursor: (anchor: number, head: number) => void;
};

type SyncClientOptions = {
  documentId: string;
  token: string;
  pollIntervalMs: number;
  getLocalRevision: () => number;
  onDocumentEvent: (event: DocumentUpdateEvent) => void;
  onMetric: (event: SyncMetricsEvent) => void;
  onPresenceUsers: (users: PresenceUser[]) => void;
  onRemoteCursor: (cursor: RemoteCursor) => void;
  onPresenceLeft: (userId: string) => void;
  onStatus: (state: SyncConnectionState) => void;
};

function websocketUrl(path: string, token: string): string {
  const base = API_URL.replace(/^http/, "ws").replace(/\/api$/, "");
  const url = new URL(path, base);
  url.searchParams.set("token", token);
  return url.toString();
}

function nowIso(): string {
  return new Date().toISOString();
}

export function createDocumentUpdateEvent(
  document: Document,
  mode: SyncMode,
  userId = "rest-api",
): DocumentUpdateEvent {
  return {
    type: "document.updated",
    documentId: document.id,
    version: document.revision,
    userId,
    timestamp: document.updatedAt,
    operation: {
      kind: mode === "rest-polling" ? "poll-document" : "replace-document",
      transport: mode,
      title: document.title,
      content: document.content,
    },
    document,
  };
}

function isDocumentUpdateEvent(payload: unknown): payload is DocumentUpdateEvent {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "type" in payload &&
    (payload as { type?: unknown }).type === "document.updated" &&
    "document" in payload
  );
}

function isPresenceUser(value: unknown): value is PresenceUser {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { id?: unknown }).id === "string" &&
    typeof (value as { name?: unknown }).name === "string" &&
    typeof (value as { initials?: unknown }).initials === "string" &&
    typeof (value as { color?: unknown }).color === "string"
  );
}

function parseJsonMessage(data: unknown): unknown | null {
  try {
    return JSON.parse(String(data)) as unknown;
  } catch {
    return null;
  }
}

function noopSendCursor() {
  return undefined;
}

export function createRestPollingClient({
  documentId,
  token,
  pollIntervalMs,
  getLocalRevision,
  onDocumentEvent,
  onMetric,
  onPresenceUsers,
  onStatus,
}: SyncClientOptions): SyncClient {
  let intervalId: number | null = null;
  let stopped = false;
  let inFlight = false;

  async function poll(): Promise<void> {
    if (stopped || inFlight) {
      return;
    }

    inFlight = true;
    onStatus("polling");
    onMetric({
      type: "request",
      mode: "rest-polling",
      timestamp: nowIso(),
    });

    try {
      const response = await fetch(`${API_URL}/documents/${documentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        onStatus("error");
        onMetric({
          type: "connection",
          mode: "rest-polling",
          timestamp: nowIso(),
          connectionState: "error",
          note: `Polling request failed with ${response.status}.`,
        });
        return;
      }

      const payload = (await response.json()) as { document: Document };
      const incomingDocument = payload.document;

      onStatus("connected");
      onPresenceUsers([]);

      if (incomingDocument.revision > getLocalRevision()) {
        onMetric({
          type: "received",
          mode: "rest-polling",
          sentAt: incomingDocument.updatedAt,
          receivedAt: nowIso(),
        });
        onDocumentEvent(createDocumentUpdateEvent(incomingDocument, "rest-polling"));
      }
    } catch (error) {
      onStatus("error");
      onMetric({
        type: "connection",
        mode: "rest-polling",
        timestamp: nowIso(),
        connectionState: "error",
        note: error instanceof Error ? error.message : "Polling request failed.",
      });
    } finally {
      inFlight = false;
    }
  }

  return {
    connect: () => {
      stopped = false;
      onStatus("polling");
      onPresenceUsers([]);
      void poll();
      intervalId = window.setInterval(() => {
        void poll();
      }, pollIntervalMs);
    },
    disconnect: () => {
      stopped = true;

      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }

      onPresenceUsers([]);
      onStatus("disconnected");
    },
    sendCursor: noopSendCursor,
  };
}

function createPushClient({
  token,
  mode,
  path,
  getSubscribeMessages,
  getUpdateFromPayload,
  onDocumentEvent,
  onMetric,
  onPresenceUsers,
  onRemoteCursor,
  onPresenceLeft,
  onStatus,
}: SyncClientOptions & {
  mode: Exclude<SyncMode, "rest-polling">;
  path: string;
  getSubscribeMessages: () => unknown[];
  getUpdateFromPayload: (payload: unknown) => DocumentUpdateEvent | null;
}): SyncClient {
  let socket: WebSocket | null = null;
  let reconnectTimerId: number | null = null;
  let stopped = false;
  let reconnectAttempts = 0;

  function clearReconnectTimer(): void {
    if (reconnectTimerId !== null) {
      window.clearTimeout(reconnectTimerId);
      reconnectTimerId = null;
    }
  }

  function scheduleReconnect(): void {
    if (stopped) {
      return;
    }

    reconnectAttempts += 1;
    const delayMs = Math.min(5000, 500 * reconnectAttempts);
    onStatus("reconnecting");
    onMetric({
      type: "connection",
      mode,
      timestamp: nowIso(),
      connectionState: "reconnecting",
      note: `Reconnect attempt ${reconnectAttempts}.`,
    });
    reconnectTimerId = window.setTimeout(connectSocket, delayMs);
  }

  function handlePresencePayload(payload: unknown): boolean {
    if (typeof payload !== "object" || payload === null || !("type" in payload)) {
      return false;
    }

    const typedPayload = payload as {
      type?: unknown;
      users?: unknown;
      user?: unknown;
      userId?: unknown;
      anchor?: unknown;
      head?: unknown;
      timestamp?: unknown;
    };

    if (typedPayload.type === "presence.snapshot" && Array.isArray(typedPayload.users)) {
      onPresenceUsers(typedPayload.users.filter(isPresenceUser));
      return true;
    }

    if (typedPayload.type === "presence.joined" && isPresenceUser(typedPayload.user)) {
      onPresenceUsers([typedPayload.user]);
      return true;
    }

    if (typedPayload.type === "presence.left" && typeof typedPayload.userId === "string") {
      onPresenceLeft(typedPayload.userId);
      return true;
    }

    if (
      typedPayload.type === "presence.cursor" &&
      isPresenceUser(typedPayload.user) &&
      typeof typedPayload.anchor === "number" &&
      typeof typedPayload.head === "number"
    ) {
      onRemoteCursor({
        user: typedPayload.user,
        anchor: typedPayload.anchor,
        head: typedPayload.head,
        updatedAt:
          typeof typedPayload.timestamp === "string"
            ? typedPayload.timestamp
            : nowIso(),
      });
      return true;
    }

    return false;
  }

  function connectSocket(): void {
    clearReconnectTimer();
    socket = new WebSocket(websocketUrl(path, token));

    socket.addEventListener("open", () => {
      reconnectAttempts = 0;
      onStatus("connected");
      onMetric({
        type: "connection",
        mode,
        timestamp: nowIso(),
        connectionState: "connected",
      });

      for (const message of getSubscribeMessages()) {
        socket?.send(JSON.stringify(message));
      }
    });

    socket.addEventListener("message", (event) => {
      const payload = parseJsonMessage(event.data);

      if (!payload) {
        onStatus("error");
        onMetric({
          type: "connection",
          mode,
          timestamp: nowIso(),
          connectionState: "error",
          note: "Received malformed JSON message.",
        });
        return;
      }

      if (handlePresencePayload(payload)) {
        return;
      }

      const update = getUpdateFromPayload(payload);

      if (!update) {
        return;
      }

      onMetric({
        type: "received",
        mode,
        sentAt: update.timestamp,
        receivedAt: nowIso(),
      });
      onDocumentEvent(update);
    });

    socket.addEventListener("error", () => {
      onStatus("error");
      onMetric({
        type: "connection",
        mode,
        timestamp: nowIso(),
        connectionState: "error",
      });
    });

    socket.addEventListener("close", () => {
      socket = null;
      onPresenceUsers([]);
      onStatus(stopped ? "disconnected" : "reconnecting");

      if (!stopped) {
        scheduleReconnect();
      }
    });
  }

  return {
    connect: () => {
      stopped = false;
      connectSocket();
    },
    disconnect: () => {
      stopped = true;
      clearReconnectTimer();

      if (socket?.readyState === WebSocket.OPEN) {
        socket.close();
      }

      socket = null;
      onPresenceUsers([]);
      onStatus("disconnected");
    },
    sendCursor: (anchor, head) => {
      if (mode !== "websocket" || socket?.readyState !== WebSocket.OPEN) {
        return;
      }

      socket.send(
        JSON.stringify({
          type: "presence.cursor",
          anchor,
          head,
        }),
      );
    },
  };
}

export function createWebSocketClient(options: SyncClientOptions): SyncClient {
  return createPushClient({
    ...options,
    mode: "websocket",
    path: "/sync/documents",
    getSubscribeMessages: () => [{ type: "join", documentId: options.documentId }],
    getUpdateFromPayload: (payload) => {
      return isDocumentUpdateEvent(payload) ? payload : null;
    },
  });
}

export function createGraphqlSubscriptionClient(options: SyncClientOptions): SyncClient {
  const subscriptionId = "document-updates";

  return createPushClient({
    ...options,
    mode: "graphql-subscription",
    path: "/graphql",
    getSubscribeMessages: () => [
      { type: "connection_init" },
      {
        id: subscriptionId,
        type: "subscribe",
        payload: {
          query:
            "subscription DocumentUpdated($documentId: ID!) { documentUpdated(documentId: $documentId) { documentId version userId timestamp operation document } }",
          variables: { documentId: options.documentId },
        },
      },
    ],
    getUpdateFromPayload: (payload) => {
      if (typeof payload !== "object" || payload === null) {
        return null;
      }

      const update = (
        payload as {
          payload?: {
            data?: {
              documentUpdated?: unknown;
            };
          };
        }
      ).payload?.data?.documentUpdated;

      return isDocumentUpdateEvent(update) ? update : null;
    },
  });
}
