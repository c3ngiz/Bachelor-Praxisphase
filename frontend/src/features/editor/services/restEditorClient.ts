import axios, { type AxiosInstance } from 'axios';

import { env } from '../../../config/env';
import { throwNormalizedApiError } from '../../auth/api/authApiError';
import { authTokenStorage } from '../../auth/api/authTokenStorage';
import type { EntityId } from '../../workspace/types/workspace.types';
import {
  toDocumentContentResult,
  type BackendDocumentContent,
} from './editorContentMappers';
import type {
  DocumentContentResult,
  DocumentEditorLoadResult,
  EditorClient,
  GetDocumentMetadataOptions,
  UpdateDocumentContentInput,
} from '../types/editor.types';

/** REST client for document editor content endpoints. */
export class RestEditorClient implements EditorClient {
  private readonly http: AxiosInstance;

  /**
   * Creates a REST editor client.
   *
   * @param baseUrl - REST backend base URL.
   */
  constructor(baseUrl: string = env.restApiUrl) {
    this.http = axios.create({
      baseURL: baseUrl,
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
   * Loads document metadata and permission state.
   *
   * @param documentId - Workspace document identifier.
   * @param options - Optional load behavior for metadata touching.
   * @returns Normalized editor content response.
   */
  async getDocumentMetadata(
    documentId: EntityId,
    options?: GetDocumentMetadataOptions,
  ): Promise<DocumentEditorLoadResult> {
    const result = await this.getDocumentContent(documentId, options);

    return {
      canWrite: result.canWrite,
      document: result.document,
      revision: result.revision,
      updatedAt: result.updatedAt,
    };
  }

  /**
   * Loads document content and permission state.
   *
   * @param documentId - Workspace document identifier.
   * @param options - Optional load behavior for metadata touching.
   * @returns Normalized editor content response.
   */
  async getDocumentContent(
    documentId: EntityId,
    options?: GetDocumentMetadataOptions,
  ): Promise<DocumentContentResult> {
    try {
      const response = await this.http.get<BackendDocumentContent>(
        `/api/workspace/documents/${encodeURIComponent(documentId)}/content`,
        {
          params: options?.touch === false ? { touch: 'false' } : undefined,
        },
      );

      return toDocumentContentResult(response.data);
    } catch (error) {
      throwNormalizedApiError(error);
    }
  }

  /**
   * Saves document content and returns the incremented revision.
   *
   * @param input - Document save input.
   * @returns Normalized editor content response.
   */
  async updateDocumentContent(input: UpdateDocumentContentInput): Promise<DocumentContentResult> {
    try {
      const response = await this.http.patch<BackendDocumentContent>(
        `/api/workspace/documents/${encodeURIComponent(input.documentId)}/content`,
        {
          content: input.content,
          revision: input.revision,
          title: input.title,
        },
      );

      return toDocumentContentResult(response.data);
    } catch (error) {
      throwNormalizedApiError(error);
    }
  }
}
