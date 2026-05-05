import { useMemo } from 'react';
import type { DocumentItem } from '../types/documents.types';

/** Return value for document list state. */
export interface UseDocumentsResult {
  /** Mocked documents for the current view. */
  documents: DocumentItem[];
}

/** Provides document list state for document screens. */
export function useDocuments(): UseDocumentsResult {
  const documents = useMemo<DocumentItem[]>(
    () => [
      {
        id: 'doc-1',
        title: 'Example Document',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
    ],
    [],
  );

  return { documents };
}
