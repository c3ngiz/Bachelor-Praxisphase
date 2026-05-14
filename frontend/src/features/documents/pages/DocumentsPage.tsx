import { DocumentList } from '../components/DocumentList';
import { useDocuments } from '../hooks/useDocuments';

/** Documents page for browsing document records. */
export function DocumentsPage(): JSX.Element {
  const { documents } = useDocuments();

  return (
    <section>
      <h1>Documents Page</h1>
      <DocumentList documents={documents} />
    </section>
  );
}
