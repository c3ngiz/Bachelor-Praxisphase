import { NormalizedApiError } from '../../auth/api/authApiError';
import { toWorkspaceItem, type BackendWorkspaceItem } from '../../workspace/api/workspaceMappers';
import type { DocumentContentResult, JsonObject, JsonValue } from '../types/editor.types';

/** Backend document content shape shared by REST and GraphQL editor clients. */
export interface BackendDocumentContent {
  /** Workspace document identifier. */
  documentId: string;
  /** Workspace document metadata. */
  document: BackendWorkspaceItem;
  /** TipTap/ProseMirror JSON document content. */
  content: unknown;
  /** Optimistic content revision. */
  revision: number;
  /** Whether the current user may save changes. */
  canWrite: boolean;
  /** ISO update timestamp. */
  updatedAt: string;
}

/**
 * Maps backend document content into the editor's normalized plain-text payload.
 *
 * @param response - Backend document content response.
 * @returns Normalized document content result.
 */
export function toDocumentContentResult(
  response: BackendDocumentContent,
): DocumentContentResult {
  const item = toWorkspaceItem(response.document);

  if (item.kind !== 'document') {
    throw new NormalizedApiError({
      message: 'The requested workspace item is not a document.',
    });
  }

  const content = isJsonObject(response.content)
    ? response.content
    : plainTextToTiptap(String(response.content ?? ''));

  return {
    canWrite: response.canWrite,
    content,
    document: item,
    revision: response.revision,
    textContent: tiptapToPlainText(content),
    updatedAt: response.updatedAt,
  };
}

/**
 * Converts plain text into the simple TipTap JSON shape accepted by the backend.
 *
 * @param text - Plain text from CodeMirror.
 * @returns TipTap-compatible JSON document.
 */
export function plainTextToTiptap(text: string): JsonObject {
  const paragraphs = text.split('\n');

  return {
    content: paragraphs.map((paragraph) => ({
      content: paragraph.length > 0 ? [{ text: paragraph, type: 'text' }] : [],
      type: 'paragraph',
    })),
    type: 'doc',
  };
}

/**
 * Projects TipTap/ProseMirror JSON content into plain text for CodeMirror.
 *
 * @param node - JSON node returned by the document content API.
 * @returns Plain-text content.
 */
export function tiptapToPlainText(node: unknown): string {
  if (!isJsonObject(node)) {
    return '';
  }

  const nodeType = typeof node.type === 'string' ? node.type : '';

  if (nodeType === 'text') {
    return typeof node.text === 'string' ? node.text : '';
  }

  const children = Array.isArray(node.content) ? node.content : [];
  const renderedChildren = children.map(tiptapToPlainText);

  if (nodeType === 'doc' || nodeType === 'bulletList' || nodeType === 'orderedList') {
    return renderedChildren.filter(Boolean).join('\n');
  }

  return renderedChildren.join('');
}

/**
 * Checks whether an unknown value is a JSON object.
 *
 * @param value - Unknown value to inspect.
 * @returns True when the value is a non-array JSON object.
 */
function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Checks whether an unknown value is JSON serializable by the editor API.
 *
 * @param value - Unknown value to inspect.
 * @returns True when the value is a supported JSON value.
 */
export function isJsonValue(value: unknown): value is JsonValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }

  if (isJsonObject(value)) {
    return Object.values(value).every(isJsonValue);
  }

  return false;
}
