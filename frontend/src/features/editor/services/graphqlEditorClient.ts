import axios, { type AxiosInstance } from 'axios';

import { env } from '../../../config/env';
import { NormalizedApiError, throwNormalizedApiError } from '../../auth/api/authApiError';
import { authTokenStorage } from '../../auth/api/authTokenStorage';
import { workspaceItemFields } from '../../workspace/api/graphql/workspaceDocuments';
import type { EntityId } from '../../workspace/types/workspace.types';
import {
  toDocumentContentResult,
  type BackendDocumentContent,
} from './editorContentMappers';
import type {
  DocumentContentResult,
  DocumentContentSubscriptionHandlers,
  DocumentEditorLoadResult,
  EditorClient,
  GetDocumentMetadataOptions,
  UpdateDocumentContentInput,
} from '../types/editor.types';

/** GraphQL document content fields shared by editor operations. */
const documentContentFields = `
  documentId
  content
  revision
  canWrite
  updatedAt
  document {
    ${workspaceItemFields}
  }
`;

/** GraphQL query used to load document content. */
const documentContentQuery = `
  query DocumentContent($documentId: ID!) {
    documentContent(documentId: $documentId) {
      ${documentContentFields}
    }
  }
`;

/** GraphQL mutation used to save document content. */
const updateDocumentContentMutation = `
  mutation UpdateDocumentContent($input: UpdateDocumentContentInput!) {
    updateDocumentContent(input: $input) {
      ${documentContentFields}
    }
  }
`;

/** GraphQL subscription used to receive remote document content updates. */
const documentContentUpdatedSubscription = `
  subscription DocumentContentUpdated($documentId: ID!) {
    documentContentUpdated(documentId: $documentId) {
      ${documentContentFields}
    }
  }
`;

/** GraphQL response envelope returned by the backend. */
interface GraphqlResponse<TData> {
  /** Operation data when present. */
  data?: TData;
  /** GraphQL errors returned by execution. */
  errors?: GraphqlResponseError[];
}

/** GraphQL error returned by the backend. */
interface GraphqlResponseError {
  /** Human-readable error message. */
  message?: string;
  /** Backend extensions used for normalized frontend errors. */
  extensions?: {
    /** Stable backend error code. */
    code?: string;
    /** HTTP-like status code. */
    statusCode?: number;
    /** Optional field validation details. */
    issues?: {
      /** Field validation errors keyed by field name. */
      fieldErrors?: Record<string, string[]>;
    };
  };
}

/** GraphQL request body sent through axios. */
interface GraphqlRequest<TVariables> {
  /** GraphQL document string. */
  query: string;
  /** Variables referenced by the document. */
  variables?: TVariables;
}

/** GraphQL subscription socket message shape. */
interface GraphqlWsMessage {
  /** GraphQL over WebSocket message type. */
  type?: string;
  /** Operation id for subscription messages. */
  id?: string;
  /** Message payload. */
  payload?: unknown;
}

/** GraphQL editor client backed by HTTP operations and GraphQL WebSocket subscriptions. */
export class GraphqlEditorClient implements EditorClient {
  private readonly http: AxiosInstance;
  private readonly subscriptionUrl: string;

  /**
   * Creates a GraphQL editor client.
   *
   * @param endpointUrl - Full URL of the GraphQL HTTP endpoint.
   * @param subscriptionUrl - Full URL of the GraphQL WebSocket endpoint.
   */
  constructor(endpointUrl: string = env.graphqlApiUrl, subscriptionUrl: string = env.graphqlWsUrl) {
    this.subscriptionUrl = subscriptionUrl;
    this.http = axios.create({
      baseURL: endpointUrl,
      withCredentials: true,
    });

    this.http.interceptors.request.use((config) => {
      const token = authTokenStorage.getToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    });
  }

  /**
   * Loads document metadata through the document content query.
   *
   * @param documentId - Workspace document identifier.
   * @param options - Optional load behavior.
   * @returns Normalized document metadata.
   */
  async getDocumentMetadata(
    documentId: EntityId,
    options?: GetDocumentMetadataOptions,
  ): Promise<DocumentEditorLoadResult> {
    void options;
    const result = await this.getDocumentContent(documentId);

    return {
      canWrite: result.canWrite,
      document: result.document,
      revision: result.revision,
      updatedAt: result.updatedAt,
    };
  }

  /**
   * Loads document content through the GraphQL API.
   *
   * @param documentId - Workspace document identifier.
   * @param options - Optional load behavior.
   * @returns Normalized document content.
   */
  async getDocumentContent(
    documentId: EntityId,
    options?: GetDocumentMetadataOptions,
  ): Promise<DocumentContentResult> {
    void options;
    const data = await this.request<
      { documentContent: BackendDocumentContent },
      { documentId: EntityId }
    >(documentContentQuery, { documentId });

    return toDocumentContentResult(data.documentContent);
  }

  /**
   * Saves document content through the GraphQL API.
   *
   * @param input - Document save input.
   * @returns Normalized document content.
   */
  async updateDocumentContent(input: UpdateDocumentContentInput): Promise<DocumentContentResult> {
    const data = await this.request<
      { updateDocumentContent: BackendDocumentContent },
      { input: UpdateDocumentContentInput }
    >(updateDocumentContentMutation, { input });

    return toDocumentContentResult(data.updateDocumentContent);
  }

  /**
   * Subscribes to remote document content updates through GraphQL over WebSocket.
   *
   * @param documentId - Workspace document identifier.
   * @param handlers - Subscription lifecycle and payload handlers.
   * @returns Cleanup function that closes the subscription.
   */
  subscribeToDocumentContent(
    documentId: EntityId,
    handlers: DocumentContentSubscriptionHandlers,
  ): () => void {
    const operationId = createClientId();
    const token = authTokenStorage.getToken();
    const socket = new WebSocket(this.subscriptionUrl, 'graphql-transport-ws');
    let didClose = false;

    socket.addEventListener('open', () => {
      socket.send(
        JSON.stringify({
          payload: {
            Authorization: token ? `Bearer ${token}` : undefined,
            authorization: token ? `Bearer ${token}` : undefined,
          },
          type: 'connection_init',
        }),
      );
    });

    socket.addEventListener('message', (event) => {
      const message = parseGraphqlWsMessage(event.data);

      if (message.type === 'connection_ack') {
        handlers.onConnected?.();
        socket.send(
          JSON.stringify({
            id: operationId,
            payload: {
              query: documentContentUpdatedSubscription,
              variables: { documentId },
            },
            type: 'subscribe',
          }),
        );
        return;
      }

      if (message.type === 'next' && message.id === operationId) {
        const response = message.payload as
          | GraphqlResponse<{ documentContentUpdated: BackendDocumentContent }>
          | undefined;

        if (response?.errors?.length) {
          handlers.onError?.(toNormalizedGraphqlError(response.errors[0]));
          return;
        }

        if (response?.data?.documentContentUpdated) {
          handlers.onNext(toDocumentContentResult(response.data.documentContentUpdated));
        }
        return;
      }

      if (message.type === 'error') {
        handlers.onError?.(new Error('GraphQL subscription failed.'));
        return;
      }

      if (message.type === 'complete' && message.id === operationId) {
        handlers.onDisconnected?.();
      }
    });

    socket.addEventListener('error', () => {
      handlers.onError?.(new Error('GraphQL subscription socket encountered an error.'));
    });

    socket.addEventListener('close', () => {
      if (!didClose) {
        handlers.onDisconnected?.();
      }
    });

    return () => {
      didClose = true;

      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ id: operationId, type: 'complete' }));
      }

      socket.close();
    };
  }

  /**
   * Executes a GraphQL operation and normalizes transport or execution errors.
   *
   * @param query - GraphQL document string.
   * @param variables - Operation variables.
   * @returns Typed GraphQL operation data.
   */
  private async request<TData, TVariables>(query: string, variables?: TVariables): Promise<TData> {
    try {
      const response = await this.http.post<
        GraphqlResponse<TData>,
        { data: GraphqlResponse<TData> },
        GraphqlRequest<TVariables>
      >('', { query, variables });

      if (response.data.errors?.length) {
        throw toNormalizedGraphqlError(response.data.errors[0]);
      }

      if (!response.data.data) {
        throw new NormalizedApiError({ message: 'GraphQL response did not include data.' });
      }

      return response.data.data;
    } catch (error) {
      throwNormalizedApiError(error);
    }
  }
}

/**
 * Converts one GraphQL execution error into the frontend API error class.
 *
 * @param error - GraphQL response error returned by the backend.
 * @returns Normalized API error.
 */
function toNormalizedGraphqlError(error: GraphqlResponseError | undefined): NormalizedApiError {
  return new NormalizedApiError({
    code: error?.extensions?.code,
    fieldErrors: error?.extensions?.issues?.fieldErrors,
    message: error?.message ?? 'GraphQL request failed. Please try again.',
    statusCode: error?.extensions?.statusCode,
  });
}

/**
 * Parses one GraphQL WebSocket message defensively.
 *
 * @param data - Browser WebSocket message data.
 * @returns Parsed message object.
 */
function parseGraphqlWsMessage(data: unknown): GraphqlWsMessage {
  if (typeof data !== 'string') {
    return {};
  }

  try {
    const parsed = JSON.parse(data) as unknown;
    if (!isRecord(parsed)) {
      return {};
    }

    return {
      id: typeof parsed.id === 'string' ? parsed.id : undefined,
      payload: parsed.payload,
      type: typeof parsed.type === 'string' ? parsed.type : undefined,
    };
  } catch {
    return {};
  }
}

/**
 * Checks whether a value is a non-null record.
 *
 * @param value - Unknown value to inspect.
 * @returns True when the value is a record object.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Creates a browser-stable operation identifier.
 *
 * @returns Random identifier.
 */
function createClientId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
