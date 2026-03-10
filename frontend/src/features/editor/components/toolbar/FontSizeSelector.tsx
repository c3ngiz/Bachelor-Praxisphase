import { Editor } from "@tiptap/react"

type Props = {
    editor: Editor
}

const sizes = ["12px", "14px", "16px", "18px", "24px"]

export default function FontSizeSelector({ editor }: Props) {
    return (
        <select
            className="rounded border border-(--border) bg-(--bg-elevated) px-2 py-1 text-sm"
            onChange={(e) =>
                editor.chain().focus().setMark("textStyle", { fontSize: e.target.value }).run()
            }
        >
            {sizes.map((size) => (
                <option key={size}>{size}</option>
            ))}
        </select>
    )
}