import { EditorContent } from '@tiptap/react';

import { Button } from '../../../shared/components';
import { EditorShell } from '../components/EditorShell';
import { useDocumentEditor } from '../hooks/useDocumentEditor';

/** Props accepted by the document editor route. */
export interface EditorPageProps {
  /** Dynamic route parameters supplied by the app router. */
  params?: Record<string, string>;
}

/** Editor page for authoring collaborative document content. */
export function EditorPage({ params }: EditorPageProps): JSX.Element {
  const documentId = params?.documentId ?? null;
  const editorState = useDocumentEditor({ documentId });

  if (!documentId) {
    return (
      <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        Missing document id.
      </section>
    );
  }

  if (editorState.isLoading && !editorState.document) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Loading document...
      </section>
    );
  }

  if (editorState.error && !editorState.document) {
    return (
      <section
        className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"
        role="alert"
      >
        <p className="m-0 text-sm">{editorState.error}</p>
        <Button onClick={() => void editorState.reloadDocument()} size="sm" variant="secondary">
          Retry
        </Button>
      </section>
    );
  }

  if (!editorState.document) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Document not found.
      </section>
    );
  }

  return (
    <EditorShell
      canEdit={editorState.canEdit}
      collaborationStatus={editorState.collaboration.status}
      collaborators={editorState.collaboration.users}
      document={editorState.document}
      editor={editorState.editor}
      onSave={() => void editorState.autosave.saveNow()}
      saveError={editorState.autosave.saveError}
      saveStatus={editorState.autosave.saveStatus}
    >
      <EditorContent editor={editorState.editor} />
    </EditorShell>
  );
}
