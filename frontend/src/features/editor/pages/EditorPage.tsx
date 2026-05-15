import { EditorShell } from '../components/EditorShell';
import { useDocumentEditor } from '../hooks/useDocumentEditor';

/** Props accepted by the document editor route. */
export interface EditorPageProps {
  /** Dynamic route parameters supplied by the app router. */
  params?: Record<string, string>;
}

/**
 * Route page mounted at `/workspace/document/:documentId`.
 *
 * @param props - Route props.
 * @returns Document editor page.
 */
export function EditorPage({ params }: EditorPageProps): JSX.Element {
  const documentId = params?.documentId;

  if (!documentId) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
        Document id is missing from the route.
      </div>
    );
  }

  return <EditorRouteContent documentId={documentId} />;
}

interface EditorRouteContentProps {
  /** Workspace document identifier from the matched route. */
  documentId: string;
}

/**
 * Owns the editor hook for a known document route.
 *
 * @param props - Route content props.
 * @returns Hydrated editor shell.
 */
function EditorRouteContent({ documentId }: EditorRouteContentProps): JSX.Element {
  const state = useDocumentEditor({ documentId });

  return <EditorShell state={state} />;
}
