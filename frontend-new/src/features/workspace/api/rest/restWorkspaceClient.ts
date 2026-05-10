import axios, { type AxiosInstance } from 'axios';

import { env } from '../../../../config/env';
import { throwNormalizedApiError } from '../../../auth/api/authApiError';
import { authTokenStorage } from '../../../auth/api/authTokenStorage';
import {
  toMoveTargets,
  toWorkspaceItem,
  toWorkspaceItemsResult,
  type BackendMoveTarget,
  type BackendWorkspaceItem,
  type BackendWorkspaceItemsResponse,
} from '../workspaceMappers';
import type {
  CreateDocumentInput,
  CreateFolderInput,
  DeleteItemInput,
  DocumentItem,
  EntityId,
  FolderItem,
  MoveItemInput,
  MoveTarget,
  RemoveCollaboratorInput,
  RenameItemInput,
  ShareInvite,
  UpdateCollaboratorInput,
  WorkspaceClient,
  WorkspaceItem,
  WorkspaceItemsResult,
} from '../../types/workspace.types';

interface RestWorkspaceItemResponse {
  /** Updated or created workspace item returned by REST. */
  item: BackendWorkspaceItem;
}

interface RestWorkspaceItemsResponse {
  /** Folder contents returned by REST. */
  workspace: BackendWorkspaceItemsResponse;
}

interface RestMoveTargetsResponse {
  /** Valid move destinations returned by REST. */
  targets: BackendMoveTarget[];
}

/** REST client for assumed persisted workspace hierarchy endpoints. */
export class RestWorkspaceClient implements WorkspaceClient {
  private readonly http: AxiosInstance;

  /**
   * Creates a REST workspace client.
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
   * Lists child items for a workspace folder.
   *
   * @param parentId - Folder identifier, or null for root.
   * @returns Normalized workspace listing.
   */
  async listItems(parentId: EntityId | null): Promise<WorkspaceItemsResult> {
    try {
      const query = parentId ? `?parentId=${encodeURIComponent(parentId)}` : '';
      const response = await this.http.get<
        RestWorkspaceItemsResponse | BackendWorkspaceItemsResponse
      >(`/api/workspace/items${query}`);
      const payload = 'workspace' in response.data ? response.data.workspace : response.data;
      return toWorkspaceItemsResult(payload);
    } catch (error) {
      throwNormalizedApiError(error);
    }
  }

  /**
   * Creates a folder through the assumed REST folder endpoint.
   *
   * @param input - Folder creation input.
   * @returns Created folder.
   */
  async createFolder(input: CreateFolderInput): Promise<FolderItem> {
    try {
      const response = await this.http.post<RestWorkspaceItemResponse>(
        '/api/workspace/folders',
        input,
      );
      const item = toWorkspaceItem(response.data.item);
      return item.kind === 'folder' ? item : { ...item, kind: 'folder' };
    } catch (error) {
      throwNormalizedApiError(error);
    }
  }

  /**
   * Creates a document shell through the assumed REST document endpoint.
   *
   * @param input - Document creation input.
   * @returns Created document item.
   */
  async createDocument(input: CreateDocumentInput): Promise<DocumentItem> {
    try {
      const response = await this.http.post<RestWorkspaceItemResponse>(
        '/api/workspace/documents',
        input,
      );
      const item = toWorkspaceItem(response.data.item);
      return item.kind === 'document' ? item : { ...item, kind: 'document' };
    } catch (error) {
      throwNormalizedApiError(error);
    }
  }

  /**
   * Renames a workspace item.
   *
   * @param input - Rename input.
   * @returns Updated item.
   */
  async renameItem(input: RenameItemInput): Promise<WorkspaceItem> {
    try {
      const response = await this.http.patch<RestWorkspaceItemResponse>(
        `/api/workspace/items/${encodeURIComponent(input.itemId)}/rename`,
        { name: input.name },
      );
      return toWorkspaceItem(response.data.item);
    } catch (error) {
      throwNormalizedApiError(error);
    }
  }

  /**
   * Deletes a workspace item.
   *
   * @param input - Delete input.
   */
  async deleteItem(input: DeleteItemInput): Promise<void> {
    try {
      await this.http.delete(`/api/workspace/items/${encodeURIComponent(input.itemId)}`);
    } catch (error) {
      throwNormalizedApiError(error);
    }
  }

  /**
   * Lists valid move destinations.
   *
   * @param itemId - Item being moved.
   * @returns Available folder destinations.
   */
  async listMoveTargets(itemId: EntityId): Promise<MoveTarget[]> {
    try {
      const response = await this.http.get<RestMoveTargetsResponse>(
        `/api/workspace/move-targets?excludeItemId=${encodeURIComponent(itemId)}`,
      );
      return toMoveTargets(response.data.targets);
    } catch (error) {
      throwNormalizedApiError(error);
    }
  }

  /**
   * Moves a workspace item.
   *
   * @param input - Move input.
   * @returns Updated item.
   */
  async moveItem(input: MoveItemInput): Promise<WorkspaceItem> {
    try {
      const response = await this.http.patch<RestWorkspaceItemResponse>(
        `/api/workspace/items/${encodeURIComponent(input.itemId)}/move`,
        { targetFolderId: input.targetFolderId },
      );
      return toWorkspaceItem(response.data.item);
    } catch (error) {
      throwNormalizedApiError(error);
    }
  }

  /**
   * Shares a workspace item.
   *
   * @param input - Share invitation input.
   * @returns Updated item.
   */
  async shareItem(input: ShareInvite): Promise<WorkspaceItem> {
    try {
      const response = await this.http.post<RestWorkspaceItemResponse>(
        `/api/workspace/items/${encodeURIComponent(input.itemId)}/share`,
        {
          email: input.email,
          permission: input.permission,
        },
      );
      return toWorkspaceItem(response.data.item);
    } catch (error) {
      throwNormalizedApiError(error);
    }
  }

  /**
   * Updates collaborator permission.
   *
   * @param input - Collaborator update input.
   * @returns Updated item.
   */
  async updateCollaborator(input: UpdateCollaboratorInput): Promise<WorkspaceItem> {
    try {
      const response = await this.http.patch<RestWorkspaceItemResponse>(
        `/api/workspace/items/${encodeURIComponent(input.itemId)}/collaborators/${encodeURIComponent(
          input.collaboratorId,
        )}`,
        { permission: input.permission },
      );
      return toWorkspaceItem(response.data.item);
    } catch (error) {
      throwNormalizedApiError(error);
    }
  }

  /**
   * Removes collaborator access.
   *
   * @param input - Collaborator removal input.
   * @returns Updated item.
   */
  async removeCollaborator(input: RemoveCollaboratorInput): Promise<WorkspaceItem> {
    try {
      const response = await this.http.delete<RestWorkspaceItemResponse>(
        `/api/workspace/items/${encodeURIComponent(input.itemId)}/collaborators/${encodeURIComponent(
          input.collaboratorId,
        )}`,
      );
      return toWorkspaceItem(response.data.item);
    } catch (error) {
      throwNormalizedApiError(error);
    }
  }
}
