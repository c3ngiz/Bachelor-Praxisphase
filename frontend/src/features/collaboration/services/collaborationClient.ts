import axios, { type AxiosInstance } from 'axios';

import { env } from '../../../config/env';
import { throwNormalizedApiError } from '../../auth/api/authApiError';
import { authTokenStorage } from '../../auth/api/authTokenStorage';
import type {
  CollaborationDocumentMetrics,
  CollaborationHashCheckRequest,
  CollaborationHashCheckResponse,
  CollaborationSnapshot,
} from '../types/collaboration.types';

/** REST client for collaboration diagnostics and resync endpoints. */
export class CollaborationClient {
  private readonly http: AxiosInstance;

  /**
   * Creates a collaboration REST client.
   *
   * @param baseUrl - Backend REST base URL.
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
   * Compares a client hash with the current server snapshot.
   *
   * @param documentId - Workspace document identifier.
   * @param input - Client version and hash.
   * @returns Hash comparison response.
   */
  async checkHash(
    documentId: string,
    input: CollaborationHashCheckRequest,
  ): Promise<CollaborationHashCheckResponse> {
    try {
      const response = await this.http.post<CollaborationHashCheckResponse>(
        `/api/collaboration/documents/${encodeURIComponent(documentId)}/hash-check`,
        input,
      );
      return response.data;
    } catch (error) {
      throwNormalizedApiError(error);
    }
  }

  /**
   * Loads the latest server-owned plain-text snapshot.
   *
   * @param documentId - Workspace document identifier.
   * @returns Server snapshot for safe resync.
   */
  async getSnapshot(documentId: string): Promise<CollaborationSnapshot> {
    try {
      const response = await this.http.get<CollaborationSnapshot>(
        `/api/collaboration/documents/${encodeURIComponent(documentId)}/snapshot`,
      );
      return response.data;
    } catch (error) {
      throwNormalizedApiError(error);
    }
  }

  /**
   * Loads persisted server-side collaboration metrics.
   *
   * @param documentId - Workspace document identifier.
   * @returns Document metrics useful for thesis measurements.
   */
  async getMetrics(documentId: string): Promise<CollaborationDocumentMetrics> {
    try {
      const response = await this.http.get<CollaborationDocumentMetrics>(
        `/api/collaboration/documents/${encodeURIComponent(documentId)}/metrics`,
      );
      return response.data;
    } catch (error) {
      throwNormalizedApiError(error);
    }
  }
}

/** Shared collaboration API client used by editor hooks. */
export const collaborationClient = new CollaborationClient();
