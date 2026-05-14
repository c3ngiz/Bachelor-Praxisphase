import type { DocumentItem } from '../types/documents.types';

/** Returns a stable display title for a document. */
export function getDocumentTitle(document: DocumentItem): string {
  return document.title.trim() || 'Untitled document';
}
