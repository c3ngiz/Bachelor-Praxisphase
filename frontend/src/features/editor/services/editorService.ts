import { env } from '../../../config/env';
import { GraphqlEditorClient } from './graphqlEditorClient';
import { RestEditorClient } from './restEditorClient';
import type {
  DocumentEditorLoadResult,
  EditorClient,
  GetDocumentContentOptions,
  SaveDocumentContentInput,
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
   * Loads document content for the editor route.
   *
   * @param documentId - Workspace document identifier.
   * @param options - Optional load behavior for initial loads versus polling.
   * @returns Normalized document content and permissions.
   */
  getDocumentContent(
    documentId: EntityId,
    options?: GetDocumentContentOptions,
  ): Promise<DocumentEditorLoadResult> {
    return editorClient.getDocumentContent(documentId, options);
  },

  /**
   * Saves document content and title changes.
   *
   * @param documentId - Workspace document identifier.
   * @param input - Save payload.
   * @returns Updated document content metadata.
   */
  saveDocumentContent(
    documentId: EntityId,
    input: SaveDocumentContentInput,
  ): Promise<DocumentEditorLoadResult> {
    return editorClient.saveDocumentContent(documentId, input);
  },
};
