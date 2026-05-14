import { env } from '../../../config/env';
import { GraphqlEditorClient } from './graphqlEditorClient';
import { RestEditorClient } from './restEditorClient';
import type {
  EditorClient,
  EditorDocument,
  UpdateEditorDocumentInput,
} from '../types/editor.types';

/**
 * Creates the editor client selected by the frontend API mode.
 *
 * @returns REST or GraphQL editor client.
 */
function createEditorClient(): EditorClient {
  if (env.apiMode === 'graphql') {
    return new GraphqlEditorClient();
  }

  return new RestEditorClient();
}

const editorClient = createEditorClient();

/** Frontend-facing facade for editor document workflows. */
export const editorService = {
  /**
   * Loads document metadata, content snapshot, and permissions.
   *
   * @param documentId - Document identifier.
   * @returns Normalized editor document.
   */
  getDocument(documentId: string): Promise<EditorDocument> {
    return editorClient.getDocument(documentId);
  },

  /**
   * Saves a document snapshot through the selected REST or GraphQL backend.
   *
   * Collaborative editing persists primarily through Yjs/Hocuspocus; this method
   * exists for manual saves and non-collaborative fallback paths.
   *
   * @param input - Document update input.
   * @returns Updated document.
   */
  updateDocument(input: UpdateEditorDocumentInput): Promise<EditorDocument> {
    return editorClient.updateDocument(input);
  },
};
