import { Editor } from "@tiptap/react"
import { Link } from "lucide-react"
import ToolbarButton from "./ToolbarButton"

type Props = {
    editor: Editor
}

export default function LinkButton({ editor }: Props) {
    return (
        <ToolbarButton
            onClick={() => {
                const url = prompt("Enter URL")

                if (!url) return

                editor.chain().focus().setLink({ href: url }).run()
            }}
        >
            <Link size={18} />
        </ToolbarButton>
    )
}