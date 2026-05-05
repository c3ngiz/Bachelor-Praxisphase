import type { DocumentItem } from '../types/documents.types';

/** Service facade for document data. */
export const documentsService = {
  /** Returns mocked documents for list views. */
  async list(): Promise<DocumentItem[]> {
    return [
      {
        id: 'doc-1',
        title: 'Example Document',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  },
};
