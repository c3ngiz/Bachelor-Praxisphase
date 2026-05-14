import axios, { type AxiosInstance } from 'axios';

import { env } from '../../../config/env';
import { NormalizedApiError, throwNormalizedApiError } from '../../auth/api/authApiError';
import { authTokenStorage } from '../../auth/api/authTokenStorage';
import type { EditorClient, EditorDocument, UpdateEditorDocumentInput } from '../types/editor.types';
import { toEditorDocument, type BackendEditorDocument } from './restEditorClient';
import { editorDocumentQuery, updateEditorDocumentMutation } from './editorDocuments';

interface GraphqlResponse<TData> {
  /** Operation data when present. */
  data?: TData;
  /** GraphQL execution errors. */
  errors?: Array<{ message?: string }>;
}

interface GraphqlRequest<TVariables> {
  /** GraphQL document. */
  query: string;
  /** Operation variables. */
  variables?: TVariables;
}

/** GraphQL client for editor document metadata and fallback saves. */
export class GraphqlEditorClient implements EditorClient {
  private readonly http: AxiosInstance;

  /**
   * Creates a GraphQL editor client.
   *
   * @param endpointUrl - GraphQL endpoint URL.
   */
  constructor(endpointUrl: string = env.graphqlApiUrl) {
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
   * Loads a document through the GraphQL document query.
   *
   * @param documentId - Document identifier.
   * @returns Normalized editor document.
   */
  async getDocument(documentId: string): Promise<EditorDocument> {
    const data = await this.request<{ document: BackendEditorDocument }, { documentId: string }>(
      editorDocumentQuery,
      { documentId },
    );

    return toEditorDocument(data.document);
  }

  /**
   * Saves a document snapshot through the GraphQL updateDocument mutation.
   *
   * @param input - Update request.
   * @returns Updated normalized editor document.
   */
  async updateDocument(input: UpdateEditorDocumentInput): Promise<EditorDocument> {
    const data = await this.request<
      { updateDocument: BackendEditorDocument },
      {
        documentId: string;
        input: {
          content?: UpdateEditorDocumentInput['content'];
          expectedRevision: number;
          title?: string;
        };
      }
    >(updateEditorDocumentMutation, {
      documentId: input.documentId,
      input: {
        content: input.content,
        expectedRevision: input.expectedRevision,
        title: input.title,
      },
    });

    return toEditorDocument(data.updateDocument);
  }

  /**
   * Executes a GraphQL operation and normalizes transport errors.
   *
   * @param query - GraphQL document.
   * @param variables - Operation variables.
   * @returns Typed GraphQL response data.
   */
  private async request<TData, TVariables>(query: string, variables?: TVariables): Promise<TData> {
    try {
      const response = await this.http.post<
        GraphqlResponse<TData>,
        { data: GraphqlResponse<TData> },
        GraphqlRequest<TVariables>
      >('', { query, variables });

      if (response.data.errors?.length) {
        throw new NormalizedApiError({
          message: response.data.errors[0]?.message ?? 'GraphQL request failed.',
        });
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
