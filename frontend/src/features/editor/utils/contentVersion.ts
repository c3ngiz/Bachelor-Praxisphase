import type { DocumentContentVersion, DocumentEditorLoadResult } from '../types/editor.types';

/**
 * Extracts the stable content version marker from an editor load response.
 *
 * The REST backend increments `revision` only when document content is saved,
 * so polling uses it as the authoritative change marker instead of relying on
 * object identity or timestamps.
 *
 * @param result - Backend editor content response.
 * @returns Comparable content version marker.
 */
export function getDocumentContentVersion(
  result: DocumentEditorLoadResult,
): DocumentContentVersion {
  return {
    revision: result.revision,
    updatedAt: result.updatedAt,
  };
}

/**
 * Compares two document content versions by backend revision.
 *
 * @param left - First version.
 * @param right - Second version.
 * @returns Positive when `left` is newer, negative when older, zero when equal.
 */
export function compareDocumentContentVersions(
  left: DocumentContentVersion,
  right: DocumentContentVersion,
): number {
  return left.revision - right.revision;
}

/**
 * Checks whether a remote version is newer than the local editor base version.
 *
 * @param remote - Version returned by the polling request.
 * @param local - Version currently acknowledged by the local editor.
 * @returns True when polling should apply or surface the remote content.
 */
export function isRemoteVersionNewer(
  remote: DocumentContentVersion,
  local: DocumentContentVersion,
): boolean {
  return compareDocumentContentVersions(remote, local) > 0;
}
