import { Editor } from "@tiptap/react"

import {
    Bold,
    Italic,
    Strikethrough,
    List,
    ListOrdered,
    Heading2,
    Undo,
    Redo,
} from "lucide-react"

import ColorPicker from "@/features/editor/components/ColorPicker"

type Props = {
    editor: Editor | null
}

export default function EditorToolbar({ editor }: Props) {
    if (!editor) return null

    return (
        <div className="flex items-center gap-2 border-b border-(--border) bg-(--bg-elevated) px-4 py-2">

            <button
                onClick={() => editor.chain().focus().undo().run()}
                className="toolbar-btn"
            >
                <Undo size={18} />
            </button>

            <button
                onClick={() => editor.chain().focus().redo().run()}
                className="toolbar-btn"
            >
                <Redo size={18} />
            </button>

            <div className="mx-2 h-6 w-px bg-(--border)" />

            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className="toolbar-btn"
            >
                <Bold size={18} />
            </button>

            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className="toolbar-btn"
            >
                <Italic size={18} />
            </button>

            <button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className="toolbar-btn"
            >
                <Strikethrough size={18} />
            </button>

            <button
                onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
                className="toolbar-btn"
            >
                <Heading2 size={18} />
            </button>

            <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className="toolbar-btn"
            >
                <List size={18} />
            </button>

            <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className="toolbar-btn"
            >
                <ListOrdered size={18} />
            </button>

            <ColorPicker editor={editor} />

        </div>
    )
}