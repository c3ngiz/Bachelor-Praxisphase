import { env } from '../../../config/env';
import { GraphqlEditorClient } from './graphqlEditorClient';
import { RestEditorClient } from './restEditorClient';
import type {
  DocumentEditorLoadResult,
  EditorClient,
  GetDocumentMetadataOptions,
} from '../types/editor.types';
import type { EntityId } from '../../workspace/types/workspace.types';

/**
 * Creates the editor client for the configured API transport.
 *
 * @returns REST client by default, or GraphQL placeholder when explicitly selected.
 */
function createEditorClient(): EditorClient {
  if (env.apiMode === 'graphql') {
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
};
