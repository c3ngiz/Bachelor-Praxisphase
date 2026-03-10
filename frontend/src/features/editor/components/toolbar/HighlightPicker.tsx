import { Editor } from "@tiptap/react"

type Props = {
    editor: Editor
}

const colors = ["#fef08a", "#fde68a", "#fca5a5", "#a7f3d0"]

export default function HighlightPicker({ editor }: Props) {
    return (
        <div className="flex items-center gap-1 border-l border-(--border) pl-2">

            {colors.map((color) => (
                <button
                    key={color}
                    className="h-6 w-6 rounded border border-gray-300"
                    style={{ background: color }}
                    onClick={() =>
                        editor.chain().focus().toggleHighlight({ color }).run()
                    }
                />
            ))}

        </div>
    )
}