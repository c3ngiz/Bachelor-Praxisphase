import axios, { type AxiosInstance } from 'axios';

import { env } from '../../../../config/env';
import { NormalizedApiError, throwNormalizedApiError } from '../../../auth/api/authApiError';
import { authTokenStorage } from '../../../auth/api/authTokenStorage';
import {
  toCollaborators,
  toMoveTargets,
  toWorkspaceItem,
  toWorkspaceItemsResult,
  type BackendCollaborator,
  type BackendMoveTarget,
  type BackendWorkspaceItem,
  type BackendWorkspaceItemsResponse,
} from '../workspaceMappers';
import {
  createDocumentMutation,
  createFolderMutation,
  deleteWorkspaceItemMutation,
  itemCollaboratorsQuery,
  moveTargetsQuery,
  moveWorkspaceItemMutation,
  removeWorkspaceCollaboratorMutation,
  renameWorkspaceItemMutation,
  shareWorkspaceItemMutation,
  updateWorkspaceCollaboratorMutation,
  workspaceItemsQuery,
} from './workspaceDocuments';
import type {
  Collaborator,
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

/** GraphQL client for assumed persisted workspace hierarchy operations. */
export class GraphqlWorkspaceClient implements WorkspaceClient {
  private readonly http: AxiosInstance;

  /**
   * Creates a GraphQL workspace client.
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
   * Lists child items for a workspace folder.
   *
   * @param parentId - Folder identifier, or null for root.
   * @returns Normalized workspace listing.
   */
  async listItems(parentId: EntityId | null): Promise<WorkspaceItemsResult> {
    const data = await this.request<
      { workspaceItems: BackendWorkspaceItemsResponse },
      { parentId: EntityId | null }
    >(workspaceItemsQuery, { parentId });

    return toWorkspaceItemsResult(data.workspaceItems);
  }

  /**
   * Lists direct collaborators for an accessible item.
   *
   * @param itemId - Item whose collaborators should load.
   * @returns Normalized collaborator entries.
   */
  async listCollaborators(itemId: EntityId): Promise<Collaborator[]> {
    const data = await this.request<
      { itemCollaborators: BackendCollaborator[] },
      { itemId: EntityId }
    >(itemCollaboratorsQuery, { itemId });

    return toCollaborators(data.itemCollaborators);
  }

  /**
   * Creates a folder through the assumed GraphQL mutation.
   *
   * @param input - Folder creation input.
   * @returns Created folder.
   */
  async createFolder(input: CreateFolderInput): Promise<FolderItem> {
    const data = await this.request<
      { createFolder: BackendWorkspaceItem },
      { input: CreateFolderInput }
    >(createFolderMutation, { input });
    const item = toWorkspaceItem(data.createFolder);

    return item.kind === 'folder' ? item : { ...item, kind: 'folder' };
  }

  /**
   * Creates a document shell through the assumed GraphQL mutation.
   *
   * @param input - Document creation input.
   * @returns Created document item.
   */
  async createDocument(input: CreateDocumentInput): Promise<DocumentItem> {
    const data = await this.request<
      { createDocument: BackendWorkspaceItem },
      { input: CreateDocumentInput }
    >(createDocumentMutation, { input });
    const item = toWorkspaceItem(data.createDocument);

    return item.kind === 'document' ? item : { ...item, kind: 'document' };
  }

  /**
   * Renames a workspace item.
   *
   * @param input - Rename input.
   * @returns Updated item.
   */
  async renameItem(input: RenameItemInput): Promise<WorkspaceItem> {
    const data = await this.request<
      { renameWorkspaceItem: BackendWorkspaceItem },
      { input: RenameItemInput }
    >(renameWorkspaceItemMutation, { input });

    return toWorkspaceItem(data.renameWorkspaceItem);
  }

  /**
   * Deletes a workspace item.
   *
   * @param input - Delete input.
   */
  async deleteItem(input: DeleteItemInput): Promise<void> {
    await this.request<{ deleteWorkspaceItem: { success: boolean } }, { id: EntityId }>(
      deleteWorkspaceItemMutation,
      { id: input.itemId },
    );
  }

  /**
   * Lists valid move destinations.
   *
   * @param itemId - Item being moved.
   * @returns Available folder destinations.
   */
  async listMoveTargets(itemId: EntityId): Promise<MoveTarget[]> {
    const data = await this.request<
      { moveTargets: BackendMoveTarget[] },
      { excludeItemId: EntityId }
    >(moveTargetsQuery, { excludeItemId: itemId });

    return toMoveTargets(data.moveTargets);
  }

  /**
   * Moves a workspace item.
   *
   * @param input - Move input.
   * @returns Updated item.
   */
  async moveItem(input: MoveItemInput): Promise<WorkspaceItem> {
    const data = await this.request<
      { moveWorkspaceItem: BackendWorkspaceItem },
      { input: MoveItemInput }
    >(moveWorkspaceItemMutation, { input });

    return toWorkspaceItem(data.moveWorkspaceItem);
  }

  /**
   * Shares a workspace item.
   *
   * @param input - Share invitation input.
   * @returns Updated item.
   */
  async shareItem(input: ShareInvite): Promise<WorkspaceItem> {
    const data = await this.request<
      { shareWorkspaceItem: BackendWorkspaceItem },
      { input: { itemId: EntityId; email: string; permission: Exclude<ShareInvite['permission'], 'owner'> } }
    >(shareWorkspaceItemMutation, {
      input: {
        email: input.email,
        itemId: input.itemId,
        permission: input.permission,
      },
    });

    return toWorkspaceItem(data.shareWorkspaceItem);
  }

  /**
   * Updates collaborator permission.
   *
   * @param input - Collaborator update input.
   * @returns Updated item.
   */
  async updateCollaborator(input: UpdateCollaboratorInput): Promise<WorkspaceItem> {
    const data = await this.request<
      { updateWorkspaceCollaborator: BackendWorkspaceItem },
      { input: { itemId: EntityId; userId: EntityId; permission: UpdateCollaboratorInput['permission'] } }
    >(updateWorkspaceCollaboratorMutation, {
      input: {
        itemId: input.itemId,
        permission: input.permission,
        userId: input.collaboratorId,
      },
    });

    return toWorkspaceItem(data.updateWorkspaceCollaborator);
  }

  /**
   * Removes collaborator access.
   *
   * @param input - Collaborator removal input.
   * @returns Updated item.
   */
  async removeCollaborator(input: RemoveCollaboratorInput): Promise<WorkspaceItem> {
    const data = await this.request<
      { removeWorkspaceCollaborator: BackendWorkspaceItem },
      { input: { itemId: EntityId; userId: EntityId } }
    >(removeWorkspaceCollaboratorMutation, {
      input: {
        itemId: input.itemId,
        userId: input.collaboratorId,
      },
    });

    return toWorkspaceItem(data.removeWorkspaceCollaborator);
  }

  /**
   * Executes a GraphQL operation and normalizes transport or GraphQL errors.
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
