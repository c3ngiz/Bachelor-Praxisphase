import { Editor } from "@tiptap/react"

type Props = {
    editor: Editor
}

const fonts = ["Inter", "Arial", "Georgia", "Courier New"]

export default function FontSelector({ editor }: Props) {
    return (
        <select
            className="rounded border border-(--border) bg-(--bg-elevated) px-2 py-1 text-sm"
            onChange={(e) =>
                editor.chain().focus().setFontFamily(e.target.value).run()
            }
        >
            {fonts.map((font) => (
                <option key={font} value={font}>
                    {font}
                </option>
            ))}
        </select>
    )
}