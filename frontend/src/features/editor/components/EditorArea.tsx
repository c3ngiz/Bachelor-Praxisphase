import { EditorContent, type Editor } from "@tiptap/react";

type Props = {
  editor: Editor | null;
};

export default function EditorArea({ editor }: Props) {
  if (!editor) return null;

  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-(--bg) px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl justify-center">
        <article className="min-h-[70rem] w-full max-w-[53rem] rounded-md border border-white/90 bg-white px-8 py-10 shadow-[0_22px_70px_rgba(3,6,24,0.10)] sm:px-12 sm:py-12 lg:px-16">
          <EditorContent editor={editor} />
        </article>
      </div>
    </main>
  );
}
