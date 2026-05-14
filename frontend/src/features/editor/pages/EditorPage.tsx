import { EditorToolbar } from '../components/EditorToolbar';
import { useEditor } from '../hooks/useEditor';

/** Editor page for authoring document content. */
export function EditorPage(): JSX.Element {
  const { draft, updateContent } = useEditor();

  return (
    <section>
      <h1>Editor Page</h1>
      <EditorToolbar />
      <textarea
        aria-label="Draft content"
        onChange={(event) => updateContent(event.target.value)}
        placeholder="Start writing..."
        value={draft.content}
      />
    </section>
  );
}
