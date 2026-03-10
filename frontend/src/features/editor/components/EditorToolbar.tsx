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

import ToolbarButton from "./toolbar/ToolbarButton"
import ToolbarDivider from "./toolbar/ToolbarDivider"
import FontSelector from "./toolbar/FontSelector"
import FontSizeSelector from "./toolbar/FontSizeSelector"
import TextAlignSelector from "./toolbar/TextAlignSelector"
import LinkButton from "./toolbar/LinkButton"
import ImageUploadButton from "./toolbar/ImageUploadButton"
import HighlightPicker from "./toolbar/HighlightPicker"
import ColorPicker from "./toolbar/ColorPicker"

type Props = {
    editor: Editor | null
}

export default function EditorToolbar({ editor }: Props) {
    if (!editor) return null

    return (
        <div className="flex items-center gap-2 border-b border-(--border) bg-(--bg-elevated) px-4 py-2">

            <ToolbarButton onClick={() => editor.chain().focus().undo().run()}>
                <Undo size={18} />
            </ToolbarButton>

            <ToolbarButton onClick={() => editor.chain().focus().redo().run()}>
                <Redo size={18} />
            </ToolbarButton>

            <ToolbarDivider />

            <FontSelector editor={editor} />
            <FontSizeSelector editor={editor} />

            <ToolbarDivider />

            <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()}>
                <Bold size={18} />
            </ToolbarButton>

            <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()}>
                <Italic size={18} />
            </ToolbarButton>

            <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()}>
                <Strikethrough size={18} />
            </ToolbarButton>

            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                <Heading2 size={18} />
            </ToolbarButton>

            <ToolbarDivider />

            <TextAlignSelector editor={editor} />

            <ToolbarDivider />

            <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()}>
                <List size={18} />
            </ToolbarButton>

            <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                <ListOrdered size={18} />
            </ToolbarButton>

            <ToolbarDivider />

            <LinkButton editor={editor} />

            <ImageUploadButton editor={editor} />

            <HighlightPicker editor={editor} />

            <ColorPicker editor={editor} />

        </div>
    )
}