import { getDocument } from "@/features/documents/api/documentsApi";
import type { Document } from "@/features/documents";

export type SyncMode = "polling" | "collaboration";

export type SyncConnectionState =
  | "connected"
  | "disconnected"
  | "polling"
  | "error";

export type PresenceUser = {
  id: string;
  name: string;
  initials: string;
  color: string;
};

export type CollaborationPresenceUser = PresenceUser & {
  isTyping?: boolean;
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
  onStatus: (state: SyncConnectionState) => void;
};

function nowIso(): string {
  return new Date().toISOString();
}

function noopSendCursor() {
  return undefined;
}

export function createDocumentUpdateEvent(
  document: Document,
  mode: SyncMode,
  userId = "api-polling",
): DocumentUpdateEvent {
  return {
    type: "document.updated",
    documentId: document.id,
    version: document.revision,
    userId,
    timestamp: document.updatedAt,
    operation: {
      kind: "poll-document",
      transport: mode,
      title: document.title,
      content: document.content,
    },
    document,
  };
}

export function createPollingClient({
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
      mode: "polling",
      timestamp: nowIso(),
    });

    try {
      const { document } = await getDocument(documentId, token);

      onStatus("connected");
      onPresenceUsers([]);

      if (document.revision > getLocalRevision()) {
        onMetric({
          type: "received",
          mode: "polling",
          sentAt: document.updatedAt,
          receivedAt: nowIso(),
        });
        onDocumentEvent(createDocumentUpdateEvent(document, "polling"));
      }
    } catch (error) {
      onStatus("error");
      onMetric({
        type: "connection",
        mode: "polling",
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
