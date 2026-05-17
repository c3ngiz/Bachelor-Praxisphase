import { NormalizedApiError } from '../../auth/api/authApiError';
import type { EntityId } from '../../workspace/types/workspace.types';
import type {
  DocumentEditorLoadResult,
  EditorClient,
  GetDocumentMetadataOptions,
} from '../types/editor.types';

/**
 * Placeholder GraphQL editor client.
 *
 * The repository's current backend is REST-only for document content. Keeping
 * this class behind the editor service facade preserves the transport boundary
 * without pretending a GraphQL document-content schema already exists.
 */
export class GraphqlEditorClient implements EditorClient {
  /**
   * Throws a clear unsupported-transport error.
   *
   * @param documentId - Workspace document identifier.
   * @param options - Ignored until a GraphQL editor schema exists.
   * @returns Never resolves until a GraphQL editor schema is implemented.
   */
  getDocumentMetadata(
    documentId: EntityId,
    options?: GetDocumentMetadataOptions,
  ): Promise<DocumentEditorLoadResult> {
    void documentId;
    void options;
    return Promise.reject(createUnsupportedGraphqlError());
  }
}

/**
 * Creates the shared unsupported GraphQL error.
 *
 * @returns Normalized frontend API error.
 */
function createUnsupportedGraphqlError(): NormalizedApiError {
  return new NormalizedApiError({
    message: 'Document editor content is currently available through the REST backend only.',
  });
}
