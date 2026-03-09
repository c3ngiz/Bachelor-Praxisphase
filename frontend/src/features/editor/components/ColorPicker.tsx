import { Editor } from "@tiptap/react"

type Props = {
    editor: Editor
}

const COLORS = [
    "#000000",
    "#e11d48",
    "#2563eb",
    "#059669",
    "#f59e0b",
]

export default function ColorPicker({ editor }: Props) {
    return (
        <div className="ml-3 flex items-center gap-1 border-l border-(--border) pl-3">

            {COLORS.map((color) => (
                <button
                    key={color}
                    type="button"
                    onClick={() => editor.chain().focus().setColor(color).run()}
                    className="h-6 w-6 rounded-full border border-gray-300 hover:scale-110 transition"
                    style={{ backgroundColor: color }}
                />
            ))}

        </div>
    )
}