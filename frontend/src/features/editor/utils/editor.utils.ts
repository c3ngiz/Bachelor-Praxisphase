import type { JSONContent } from '../types/editor.types';

/**
 * Checks whether an unknown backend value can be treated as TipTap JSON.
 *
 * @param value - Value returned by the document API.
 * @returns True when the value is object-shaped TipTap content.
 */
export function isEditorJsonContent(value: unknown): value is JSONContent {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

/**
 * Normalizes unknown persisted content into a valid empty-or-document TipTap JSON node.
 *
 * The backend stores JSON snapshots for non-collaborative reads while the
 * collaboration backend stores Yjs binary state separately. This helper keeps
 * the REST/GraphQL fallback path tolerant of missing or old content.
 *
 * @param value - Backend content value.
 * @returns TipTap JSON document.
 */
export function toEditorJsonContent(value: unknown): JSONContent {
  if (isEditorJsonContent(value)) {
    return value;
  }

  return { content: [], type: 'doc' };
}

/**
 * Returns whether a TipTap JSON document has visible content.
 *
 * @param content - TipTap JSON content.
 * @returns True when at least one child node exists.
 */
export function hasEditorContent(content: JSONContent): boolean {
  return Boolean(content.content?.length);
}
