import axios, { type AxiosInstance } from 'axios';

import { env } from '../../../config/env';
import { NormalizedApiError, throwNormalizedApiError } from '../../auth/api/authApiError';
import { authTokenStorage } from '../../auth/api/authTokenStorage';
import { toWorkspaceItem, type BackendWorkspaceItem } from '../../workspace/api/workspaceMappers';
import type { EntityId } from '../../workspace/types/workspace.types';
import { normalizeEditorContent } from '../utils/editorContent';
import type {
  DocumentEditorLoadResult,
  EditorClient,
  SaveDocumentContentInput,
} from '../types/editor.types';

/** REST document content response returned by the editor backend. */
interface RestDocumentContentResponse {
  /** Workspace document metadata. */
  document: BackendWorkspaceItem;
  /** Persisted TipTap/ProseMirror JSON content. */
  content: unknown;
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
   * Loads persisted document content.
   *
   * @param documentId - Workspace document identifier.
   * @returns Normalized editor content response.
   */
  async getDocumentContent(documentId: EntityId): Promise<DocumentEditorLoadResult> {
    try {
      const response = await this.http.get<RestDocumentContentResponse>(
        `/api/workspace/documents/${encodeURIComponent(documentId)}/content`,
      );

      return toDocumentEditorLoadResult(response.data);
    } catch (error) {
      throwNormalizedApiError(error);
    }
  }

  /**
   * Saves document content through the REST autosave endpoint.
   *
   * @param documentId - Workspace document identifier.
   * @param input - Save payload.
   * @returns Updated editor content response.
   */
  async saveDocumentContent(
    documentId: EntityId,
    input: SaveDocumentContentInput,
  ): Promise<DocumentEditorLoadResult> {
    try {
      const response = await this.http.patch<RestDocumentContentResponse>(
        `/api/workspace/documents/${encodeURIComponent(documentId)}/content`,
        {
          content: input.content,
          revision: input.revision,
          title: input.title,
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
    content: normalizeEditorContent(response.content),
    document: item,
    revision: response.revision,
    updatedAt: response.updatedAt,
  };
}
