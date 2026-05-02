import type { WebSocket } from 'ws';
import type { DocumentUpdateEvent } from '../modules/documents/document.types.js';

type GraphqlClient = {
  socket: WebSocket;
  documentId: string | null;
};

type GraphqlHandlerOptions = {
  client: GraphqlClient;
  raw: Buffer;
  joinDocument: (documentId: string) => Promise<void>;
  sendJson: (socket: WebSocket, payload: unknown) => void;
};

export function sendGraphqlDocumentUpdate(
  socket: WebSocket,
  event: DocumentUpdateEvent,
  sendJson: (socket: WebSocket, payload: unknown) => void,
): void {
  sendJson(socket, {
    type: 'next',
    payload: {
      data: {
        documentUpdated: event,
      },
    },
  });
}

export function handleGraphqlSubscriptionMessage({
  client,
  raw,
  joinDocument,
  sendJson,
}: GraphqlHandlerOptions): void {
  let message: unknown;

  try {
    message = JSON.parse(raw.toString());
  } catch {
    sendJson(client.socket, {
      type: 'error',
      payload: { message: 'Invalid JSON message.' },
    });
    return;
  }

  if (typeof message !== 'object' || message === null || !('type' in message)) {
    return;
  }

  const typedMessage = message as {
    id?: string;
    type?: string;
    payload?: {
      query?: string;
      variables?: {
        documentId?: string;
      };
    };
  };

  if (typedMessage.type === 'connection_init') {
    sendJson(client.socket, { type: 'connection_ack' });
    return;
  }

  if (typedMessage.type === 'subscribe' && typedMessage.payload?.variables?.documentId) {
    void joinDocument(typedMessage.payload.variables.documentId)
      .then(() => {
        sendJson(client.socket, {
          id: typedMessage.id,
          type: 'next',
          payload: {
            data: {
              documentSubscriptionReady: true,
            },
          },
        });
      })
      .catch(() => {
        sendJson(client.socket, {
          id: typedMessage.id,
          type: 'error',
          payload: { message: 'Unable to subscribe to document updates.' },
        });
      });
  }

  if (typedMessage.type === 'complete') {
    client.documentId = null;
  }
}
