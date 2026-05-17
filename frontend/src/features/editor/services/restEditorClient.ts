import axios, { type AxiosInstance } from 'axios';

import { env } from '../../../config/env';
import { NormalizedApiError, throwNormalizedApiError } from '../../auth/api/authApiError';
import { authTokenStorage } from '../../auth/api/authTokenStorage';
import { toWorkspaceItem, type BackendWorkspaceItem } from '../../workspace/api/workspaceMappers';
import type { EntityId } from '../../workspace/types/workspace.types';
import type {
  DocumentEditorLoadResult,
  EditorClient,
  GetDocumentMetadataOptions,
} from '../types/editor.types';

/** REST document content response returned by the editor backend. */
interface RestDocumentContentResponse {
  /** Workspace document metadata. */
  document: BackendWorkspaceItem;
  /** Whether the current user may save changes. */
  canWrite: boolean;
  /** Optimistic content revision. */
  revision: number;
  /** ISO update timestamp. */
  updatedAt: string;
}

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
    try {
      const response = await this.http.get<RestDocumentContentResponse>(
        `/api/workspace/documents/${encodeURIComponent(documentId)}/content`,
        {
          params: options?.touch === false ? { touch: 'false' } : undefined,
        },
      );

      return toDocumentEditorLoadResult(response.data);
    } catch (error) {
      throwNormalizedApiError(error);
    }
  }
}

/**
 * Maps REST document content into frontend editor state.
 *
 * @param response - Raw REST response.
 * @returns Normalized load result.
 */
function toDocumentEditorLoadResult(
  response: RestDocumentContentResponse,
): DocumentEditorLoadResult {
  const item = toWorkspaceItem(response.document);

  if (item.kind !== 'document') {
    throw new NormalizedApiError({
      message: 'The requested workspace item is not a document.',
    });
  }

  return {
    canWrite: response.canWrite,
    document: item,
    revision: response.revision,
    updatedAt: response.updatedAt,
  };
}
