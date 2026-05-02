import { API_URL } from "@/shared/lib/api";
import type { Document } from "@/features/documents";

export type SyncMode = "rest-polling" | "websocket" | "graphql-subscription";

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
  | { type: "conflict"; mode: SyncMode; timestamp: string };

export type SyncClient = {
  connect: () => void;
  disconnect: () => void;
};

type SyncClientOptions = {
  documentId: string;
  token: string;
  pollIntervalMs: number;
  getLocalRevision: () => number;
  onDocument: (document: Document) => void;
  onMetric: (event: SyncMetricsEvent) => void;
};

function websocketUrl(path: string, token: string): string {
  const base = API_URL.replace(/^http/, "ws").replace(/\/api$/, "");
  const url = new URL(path, base);
  url.searchParams.set("token", token);
  return url.toString();
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

export function createRestPollingClient({
  documentId,
  token,
  pollIntervalMs,
  getLocalRevision,
  onDocument,
  onMetric,
}: SyncClientOptions): SyncClient {
  let intervalId: number | null = null;
  let stopped = false;

  async function poll(): Promise<void> {
    if (stopped) {
      return;
    }

    onMetric({
      type: "request",
      mode: "rest-polling",
      timestamp: new Date().toISOString(),
    });

    const response = await fetch(`${API_URL}/documents/${documentId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { document: Document };
    const incomingDocument = payload.document;

    if (incomingDocument.revision > getLocalRevision()) {
      onMetric({
        type: "received",
        mode: "rest-polling",
        sentAt: incomingDocument.updatedAt,
        receivedAt: new Date().toISOString(),
      });
      onDocument(incomingDocument);
    }
  }

  return {
    connect: () => {
      stopped = false;
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
    },
  };
}

export function createWebSocketClient({
  documentId,
  token,
  onDocument,
  onMetric,
}: SyncClientOptions): SyncClient {
  let socket: WebSocket | null = null;

  return {
    connect: () => {
      socket = new WebSocket(websocketUrl("/sync/documents", token));
      socket.addEventListener("open", () => {
        socket?.send(JSON.stringify({ type: "join", documentId }));
      });
      socket.addEventListener("message", (event) => {
        const payload = JSON.parse(event.data as string) as unknown;

        if (!isDocumentUpdateEvent(payload)) {
          return;
        }

        onMetric({
          type: "received",
          mode: "websocket",
          sentAt: payload.timestamp,
          receivedAt: new Date().toISOString(),
        });
        onDocument(payload.document);
      });
    },
    disconnect: () => {
      socket?.close();
      socket = null;
    },
  };
}

export function createGraphqlSubscriptionClient({
  documentId,
  token,
  onDocument,
  onMetric,
}: SyncClientOptions): SyncClient {
  let socket: WebSocket | null = null;
  const subscriptionId = "document-updates";

  return {
    connect: () => {
      socket = new WebSocket(websocketUrl("/graphql", token));
      socket.addEventListener("open", () => {
        socket?.send(JSON.stringify({ type: "connection_init" }));
        socket?.send(
          JSON.stringify({
            id: subscriptionId,
            type: "subscribe",
            payload: {
              query:
                "subscription DocumentUpdated($documentId: ID!) { documentUpdated(documentId: $documentId) { documentId version userId timestamp operation document } }",
              variables: { documentId },
            },
          }),
        );
      });
      socket.addEventListener("message", (event) => {
        const payload = JSON.parse(event.data as string) as {
          type: string;
          payload?: {
            data?: {
              documentUpdated?: DocumentUpdateEvent;
            };
          };
        };
        const update = payload.payload?.data?.documentUpdated;

        if (!update) {
          return;
        }

        onMetric({
          type: "received",
          mode: "graphql-subscription",
          sentAt: update.timestamp,
          receivedAt: new Date().toISOString(),
        });
        onDocument(update.document);
      });
    },
    disconnect: () => {
      socket?.send(JSON.stringify({ id: subscriptionId, type: "complete" }));
      socket?.close();
      socket = null;
    },
  };
}
