import { Editor } from "@tiptap/react"
import { Image } from "lucide-react"
import ToolbarButton from "./ToolbarButton"

type Props = {
    editor: Editor
}

export default function ImageUploadButton({ editor }: Props) {
    const handleUpload = () => {
        const url = prompt("Enter image URL")

        if (!url) return

        editor.chain().focus().setImage({ src: url }).run()
    }

    return (
        <ToolbarButton onClick={handleUpload}>
            <Image size={18} />
        </ToolbarButton>
    )
}