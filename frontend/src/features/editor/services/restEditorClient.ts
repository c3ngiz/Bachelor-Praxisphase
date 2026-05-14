import axios, { type AxiosInstance } from 'axios';

import { env } from '../../../config/env';
import { throwNormalizedApiError } from '../../auth/api/authApiError';
import { authTokenStorage } from '../../auth/api/authTokenStorage';
import { toEditorJsonContent } from '../utils/editor.utils';
import type {
  EditorClient,
  EditorDocument,
  EditorDocumentCollaborator,
  EditorDocumentRole,
  UpdateEditorDocumentInput,
} from '../types/editor.types';

export interface BackendEditorCollaborator {
  /** User identifier. */
  id: string;
  /** Display name. */
  name: string;
  /** Initials used in avatars. */
  initials: string;
  /** Color token. */
  color: string;
  /** Legacy document role. */
  role: 'owner' | 'editor' | 'viewer';
}

export interface BackendEditorDocument {
  /** Document identifier. */
  id: string;
  /** Document title. */
  title: string;
  /** TipTap JSON content snapshot. */
  content: unknown;
  /** Optimistic revision. */
  revision: number;
  /** ISO creation timestamp. */
  createdAt: string;
  /** ISO update timestamp. */
  updatedAt: string;
  /** Owner identifier. */
  ownerId: string;
  /** Owner display name. */
  ownerName: string;
  /** Collaborator entries. */
  collaborators: BackendEditorCollaborator[];
  /** Current user's role. */
  currentUserRole: EditorDocumentRole;
  /** Whether the current user can edit. */
  canEdit: boolean;
  /** Whether the current user can share. */
  canShare: boolean;
  /** Whether the current user can delete. */
  canDelete: boolean;
  /** Last editor id. */
  lastEditedById: string;
  /** Last editor display name. */
  lastEditedByName: string;
  /** Last edit timestamp. */
  lastEditedAt: string;
}

interface RestEditorDocumentResponse {
  /** Document returned by REST. */
  document: BackendEditorDocument;
}

/** REST client for editor document metadata and fallback saves. */
export class RestEditorClient implements EditorClient {
  private readonly http: AxiosInstance;

  /**
   * Creates a REST editor client.
   *
   * @param baseUrl - REST API base URL.
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
   * Loads a document through `GET /api/documents/:documentId`.
   *
   * @param documentId - Document identifier.
   * @returns Normalized editor document.
   */
  async getDocument(documentId: string): Promise<EditorDocument> {
    try {
      const response = await this.http.get<RestEditorDocumentResponse>(
        `/api/documents/${encodeURIComponent(documentId)}`,
      );
      return toEditorDocument(response.data.document);
    } catch (error) {
      throwNormalizedApiError(error);
    }
  }

  /**
   * Saves a document snapshot through `PATCH /api/documents/:documentId`.
   *
   * @param input - Update request.
   * @returns Updated normalized editor document.
   */
  async updateDocument(input: UpdateEditorDocumentInput): Promise<EditorDocument> {
    try {
      const response = await this.http.patch<RestEditorDocumentResponse>(
        `/api/documents/${encodeURIComponent(input.documentId)}`,
        {
          content: input.content,
          expectedRevision: input.expectedRevision,
          title: input.title,
        },
      );
      return toEditorDocument(response.data.document);
    } catch (error) {
      throwNormalizedApiError(error);
    }
  }
}

/**
 * Maps a backend document into the editor contract.
 *
 * @param document - Backend document response.
 * @returns Normalized editor document.
 */
export function toEditorDocument(document: BackendEditorDocument): EditorDocument {
  return {
    canDelete: document.canDelete,
    canEdit: document.canEdit,
    canShare: document.canShare,
    collaborators: document.collaborators.map(toEditorCollaborator),
    content: toEditorJsonContent(document.content),
    createdAt: document.createdAt,
    currentUserRole: document.currentUserRole,
    id: document.id,
    lastEditedAt: document.lastEditedAt,
    lastEditedById: document.lastEditedById,
    lastEditedByName: document.lastEditedByName,
    ownerId: document.ownerId,
    ownerName: document.ownerName,
    revision: document.revision,
    title: document.title,
    updatedAt: document.updatedAt,
  };
}

/**
 * Maps a backend collaborator into the editor contract.
 *
 * @param collaborator - Backend collaborator.
 * @returns Normalized collaborator.
 */
function toEditorCollaborator(
  collaborator: BackendEditorCollaborator,
): EditorDocumentCollaborator {
  return {
    color: collaborator.color,
    id: collaborator.id,
    initials: collaborator.initials,
    name: collaborator.name,
    role: collaborator.role,
  };
}
