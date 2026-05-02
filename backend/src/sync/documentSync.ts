import type { Server } from 'node:http';
import type { IncomingMessage } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';
import { prisma } from '../lib/prisma.js';
import { verifyAccessToken } from '../lib/jwt.js';
import type { AuthUser } from '../modules/auth/auth.types.js';
import type { DocumentCollaborator, DocumentUpdateEvent } from '../modules/documents/document.types.js';
import {
  handleGraphqlSubscriptionMessage,
  sendGraphqlDocumentUpdate,
} from './graphqlSubscriptionAdapter.js';

type ClientMode = 'websocket' | 'graphql-subscription';

type PresenceUser = {
  id: string;
  name: string;
  initials: string;
  color: string;
};

type SyncClient = {
  id: string;
  socket: WebSocket;
  user: AuthUser;
  mode: ClientMode;
  documentId: string | null;
};

const clients = new Set<SyncClient>();

function createClientId(): string {
  return `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

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

function getPresenceUser(client: SyncClient): PresenceUser {
  return {
    id: client.user.id,
    name: client.user.name,
    initials: client.user.initials,
    color: client.user.avatarColor,
  };
}

function getDocumentClients(documentId: string): SyncClient[] {
  return Array.from(clients).filter((client) => client.documentId === documentId);
}

function sendPresenceSnapshot(client: SyncClient): void {
  if (!client.documentId) {
    return;
  }

  const users = getDocumentClients(client.documentId)
    .filter((roomClient) => roomClient.id !== client.id)
    .map(getPresenceUser);

  sendJson(client.socket, {
    type: 'presence.snapshot',
    documentId: client.documentId,
    users,
    timestamp: new Date().toISOString(),
  });
}

function broadcastToDocument(documentId: string, payload: unknown, exceptClientId?: string): void {
  for (const client of getDocumentClients(documentId)) {
    if (client.id === exceptClientId) {
      continue;
    }

    sendJson(client.socket, payload);
  }
}

function broadcastPresenceJoined(client: SyncClient): void {
  if (!client.documentId) {
    return;
  }

  broadcastToDocument(
    client.documentId,
    {
      type: 'presence.joined',
      documentId: client.documentId,
      user: getPresenceUser(client),
      timestamp: new Date().toISOString(),
    },
    client.id,
  );
}

function broadcastPresenceLeft(client: SyncClient, documentId: string): void {
  broadcastToDocument(
    documentId,
    {
      type: 'presence.left',
      documentId,
      userId: client.user.id,
      timestamp: new Date().toISOString(),
    },
    client.id,
  );
}

async function canJoinDocument(client: SyncClient, documentId: string): Promise<boolean> {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      ownerId: true,
      workspaceId: true,
      collaborators: true,
    },
  });

  if (!document) {
    return false;
  }

  const collaborators = Array.isArray(document.collaborators)
    ? (document.collaborators as DocumentCollaborator[])
    : [];
  const isCollaborator = collaborators.some((collaborator) => collaborator.id === client.user.id);

  if (document.ownerId === client.user.id || isCollaborator) {
    return true;
  }

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

  return Boolean(membership && !membership.workspace.isDefault);
}

async function joinDocument(client: SyncClient, documentId: string): Promise<void> {
  if (!(await canJoinDocument(client, documentId))) {
    throw new Error('Unable to join document.');
  }

  const previousDocumentId = client.documentId;

  if (previousDocumentId && previousDocumentId !== documentId) {
    broadcastPresenceLeft(client, previousDocumentId);
  }

  client.documentId = documentId;
  sendJson(client.socket, {
    type: 'joined',
    documentId,
    userId: client.user.id,
    timestamp: new Date().toISOString(),
  });
  sendPresenceSnapshot(client);
  broadcastPresenceJoined(client);
}

function handleCursorMessage(client: SyncClient, message: { anchor?: unknown; head?: unknown }): void {
  if (!client.documentId) {
    return;
  }

  if (typeof message.anchor !== 'number' || typeof message.head !== 'number') {
    return;
  }

  broadcastToDocument(
    client.documentId,
    {
      type: 'presence.cursor',
      documentId: client.documentId,
      user: getPresenceUser(client),
      anchor: message.anchor,
      head: message.head,
      timestamp: new Date().toISOString(),
    },
    client.id,
  );
}

function handleWebSocketMessage(client: SyncClient, raw: Buffer): void {
  let message: unknown;

  try {
    message = JSON.parse(raw.toString());
  } catch {
    sendJson(client.socket, { type: 'error', message: 'Invalid JSON message.' });
    return;
  }

  const typedMessage = message as {
    type?: unknown;
    documentId?: unknown;
    anchor?: unknown;
    head?: unknown;
  };

  if (typedMessage.type === 'join' && typeof typedMessage.documentId === 'string') {
    void joinDocument(client, typedMessage.documentId).catch(() => {
      sendJson(client.socket, { type: 'error', message: 'Unable to join document.' });
    });
    return;
  }

  if (typedMessage.type === 'presence.cursor') {
    handleCursorMessage(client, typedMessage);
  }
}

export function publishDocumentUpdate(event: DocumentUpdateEvent): void {
  for (const client of clients) {
    if (client.documentId !== event.documentId) {
      continue;
    }

    if (client.mode === 'graphql-subscription') {
      sendGraphqlDocumentUpdate(client.socket, event, sendJson);
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
          id: createClientId(),
          socket: websocket,
          user,
          mode,
          documentId: null,
        };

        clients.add(client);

        websocket.on('message', (raw) => {
          const buffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw as ArrayBuffer);

          if (mode === 'graphql-subscription') {
            handleGraphqlSubscriptionMessage({
              client,
              raw: buffer,
              joinDocument: (documentId) => joinDocument(client, documentId),
              sendJson,
            });
            return;
          }

          handleWebSocketMessage(client, buffer);
        });

        websocket.on('error', () => {
          const documentId = client.documentId;
          clients.delete(client);

          if (documentId) {
            broadcastPresenceLeft(client, documentId);
          }
        });

        websocket.on('close', () => {
          const documentId = client.documentId;
          clients.delete(client);

          if (documentId) {
            broadcastPresenceLeft(client, documentId);
          }
        });
      });
    });
  });
}
