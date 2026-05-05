import { getDocumentTitle } from '../utils/documents.utils';
import type { DocumentItem } from '../types/documents.types';

/** Props for the document list component. */
export interface DocumentListProps {
  /** Documents displayed in the list. */
  documents: DocumentItem[];
}

/** Displays a reusable list of documents. */
export function DocumentList({ documents }: DocumentListProps): JSX.Element {
  return (
    <section aria-label="Document list">
      <h2>Document List</h2>
      <ul>
        {documents.map((document) => (
          <li key={document.id}>{getDocumentTitle(document)}</li>
        ))}
      </ul>
    </section>
  );
}
