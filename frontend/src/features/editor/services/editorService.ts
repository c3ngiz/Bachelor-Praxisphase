import { env } from '../../../config/env';
import { GraphqlEditorClient } from './graphqlEditorClient';
import { RestEditorClient } from './restEditorClient';
import type {
  DocumentContentResult,
  DocumentEditorLoadResult,
  EditorClient,
  GetDocumentMetadataOptions,
  UpdateDocumentContentInput,
} from '../types/editor.types';
import type { EntityId } from '../../workspace/types/workspace.types';

/**
 * Creates the editor client for the configured API transport.
 *
 * @returns REST client by default, or GraphQL client when selected by API/sync mode.
 */
function createEditorClient(): EditorClient {
  if (env.apiMode === 'graphql' || env.editorSyncMode === 'subscription') {
    return new GraphqlEditorClient();
  }

  return new RestEditorClient();
}

const editorClient = createEditorClient();

/** Frontend-facing document editor facade used by hooks. */
export const editorService = {
  /**
   * Loads workspace document metadata for the editor route.
   *
   * @param documentId - Workspace document identifier.
   * @param options - Optional load behavior for initial loads versus polling.
   * @returns Normalized document content and permissions.
   */
  getDocumentMetadata(
    documentId: EntityId,
    options?: GetDocumentMetadataOptions,
  ): Promise<DocumentEditorLoadResult> {
    return editorClient.getDocumentMetadata(documentId, options);
  },

  /**
   * Loads document content and permission state for editor sessions.
   *
   * @param documentId - Workspace document identifier.
   * @param options - Optional load behavior for polling.
   * @returns Normalized document content.
   */
  getDocumentContent(
    documentId: EntityId,
    options?: GetDocumentMetadataOptions,
  ): Promise<DocumentContentResult> {
    return editorClient.getDocumentContent(documentId, options);
  },

  /**
   * Saves document content through the selected backend transport.
   *
   * @param input - Document save input.
   * @returns Normalized document content with updated revision.
   */
  updateDocumentContent(input: UpdateDocumentContentInput): Promise<DocumentContentResult> {
    return editorClient.updateDocumentContent(input);
  },

  /**
   * Subscribes to remote document content updates when the selected client supports it.
   *
   * @returns Subscription cleanup function, or null when unsupported.
   */
  subscribeToDocumentContent: editorClient.subscribeToDocumentContent?.bind(editorClient) ?? null,
};
