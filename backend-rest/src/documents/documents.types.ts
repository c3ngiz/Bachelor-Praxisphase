import type { WorkspaceItemResponse } from '../workspace/workspace.types.js';

/**
 * Document content response returned by editor-oriented endpoints.
 */
export interface DocumentContentResponse {
  /** Workspace document metadata. */
  document: WorkspaceItemResponse;
  /** Stored TipTap/ProseMirror JSON content. */
  content: unknown;
  /** Current persisted revision. */
  revision: number;
  /** Whether the current user can save content changes. */
  canWrite: boolean;
  /** ISO update timestamp for the content row. */
  updatedAt: string;
}
