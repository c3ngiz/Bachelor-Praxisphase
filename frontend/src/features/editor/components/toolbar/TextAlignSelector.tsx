import { Editor } from "@tiptap/react"
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react"
import ToolbarButton from "./ToolbarButton"

type Props = {
    editor: Editor
}

export default function TextAlignSelector({ editor }: Props) {
    return (
        <>
            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()}>
                <AlignLeft size={18} />
            </ToolbarButton>

            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()}>
                <AlignCenter size={18} />
            </ToolbarButton>

            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()}>
                <AlignRight size={18} />
            </ToolbarButton>
        </>
    )
}