import { EditorContent, Editor } from "@tiptap/react"

type Props = {
    editor: Editor | null
}

export default function EditorArea({ editor }: Props) {
    if (!editor) return null

    return (
        <div className="flex flex-1 justify-center overflow-y-auto bg-[#f1f3f4] py-12">

            <div className="w-212.5 min-h-275 bg-white border border-gray-200 shadow-sm p-16 rounded-sm">

                <EditorContent editor={editor} />

            </div>

        </div>
    )
}