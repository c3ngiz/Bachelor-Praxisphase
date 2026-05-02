import type { Server } from 'node:http';
import type { IncomingMessage } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';
import { prisma } from '../lib/prisma.js';
import { verifyAccessToken } from '../lib/jwt.js';
import type { AuthUser } from '../modules/auth/auth.types.js';
import type { DocumentCollaborator, DocumentUpdateEvent } from '../modules/documents/document.types.js';

type ClientMode = 'websocket' | 'graphql-subscription';

type SyncClient = {
  socket: WebSocket;
  user: AuthUser;
  mode: ClientMode;
  documentId: string | null;
};

const clients = new Set<SyncClient>();

function parseBearerToken(request: IncomingMessage): string | null {
  const url = new URL(request.url ?? '/', 'http://localhost');
  const queryToken = url.searchParams.get('token');

  if (queryToken) {
    return queryToken;
  }

  const protocolHeader = request.headers['sec-websocket-protocol'];
  if (typeof protocolHeader === 'string') {
    const tokenProtocol = protocolHeader
      .split(',')
      .map((value) => value.trim())
      .find((value) => value.startsWith('token.'));

    if (tokenProtocol) {
      return tokenProtocol.slice('token.'.length);
    }
  }

  return null;
}

async function authenticateRequest(request: IncomingMessage): Promise<AuthUser | null> {
  const token = parseBearerToken(request);

  if (!token) {
    return null;
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        initials: true,
        avatarColor: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  } catch {
    return null;
  }
}

function sendJson(socket: WebSocket, payload: unknown): void {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
}

async function joinDocument(client: SyncClient, documentId: string): Promise<void> {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      ownerId: true,
      workspaceId: true,
      collaborators: true,
    },
  });

  if (!document) {
    throw new Error('Document not found.');
  }

  const collaborators = Array.isArray(document.collaborators)
    ? (document.collaborators as DocumentCollaborator[])
    : [];
  const isCollaborator = collaborators.some((collaborator) => collaborator.id === client.user.id);

  if (document.ownerId !== client.user.id && !isCollaborator) {
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: document.workspaceId,
          userId: client.user.id,
        },
      },
      select: {
        workspace: {
          select: {
            isDefault: true,
          },
        },
      },
    });

    if (!membership || membership.workspace.isDefault) {
      throw new Error('Forbidden.');
    }
  }

  client.documentId = documentId;
  sendJson(client.socket, {
    type: 'joined',
    documentId,
    userId: client.user.id,
    timestamp: new Date().toISOString(),
  });
}

function handleWebSocketMessage(client: SyncClient, raw: Buffer): void {
  let message: unknown;

  try {
    message = JSON.parse(raw.toString());
  } catch {
    sendJson(client.socket, { type: 'error', message: 'Invalid JSON message.' });
    return;
  }

  const typedMessage = message as { type?: unknown; documentId?: unknown };

  if (typedMessage.type === 'join' && typeof typedMessage.documentId === 'string') {
    const documentId = typedMessage.documentId;
    void joinDocument(client, documentId).catch(() => {
      sendJson(client.socket, { type: 'error', message: 'Unable to join document.' });
    });
  }
}

function handleGraphqlMessage(client: SyncClient, raw: Buffer): void {
  let message: unknown;

  try {
    message = JSON.parse(raw.toString());
  } catch {
    sendJson(client.socket, { type: 'error', payload: { message: 'Invalid JSON message.' } });
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
    void joinDocument(client, typedMessage.payload.variables.documentId)
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

export function publishDocumentUpdate(event: DocumentUpdateEvent): void {
  for (const client of clients) {
    if (client.documentId !== event.documentId) {
      continue;
    }

    if (client.mode === 'graphql-subscription') {
      sendJson(client.socket, {
        type: 'next',
        payload: {
          data: {
            documentUpdated: event,
          },
        },
      });
      continue;
    }

    sendJson(client.socket, event);
  }
}

export function attachDocumentSync(server: Server): void {
  const websocketServer = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url ?? '/', 'http://localhost');
    const mode: ClientMode | null =
      url.pathname === '/sync/documents'
        ? 'websocket'
        : url.pathname === '/graphql'
          ? 'graphql-subscription'
          : null;

    if (!mode) {
      return;
    }

    void authenticateRequest(request).then((user) => {
      if (!user) {
        socket.write('HTTP/1.1 401 Unauthorized\\r\\n\\r\\n');
        socket.destroy();
        return;
      }

      websocketServer.handleUpgrade(request, socket, head, (websocket) => {
        const client: SyncClient = {
          socket: websocket,
          user,
          mode,
          documentId: null,
        };

        clients.add(client);

        websocket.on('message', (raw) => {
          const buffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw as ArrayBuffer);

          if (mode === 'graphql-subscription') {
            handleGraphqlMessage(client, buffer);
            return;
          }

          handleWebSocketMessage(client, buffer);
        });

        websocket.on('close', () => {
          clients.delete(client);
        });
      });
    });
  });
}
