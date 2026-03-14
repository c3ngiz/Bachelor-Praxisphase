import { useEffect, useState } from "react"
import type { Editor } from "@tiptap/react"
import { Highlighter } from "lucide-react"
import ColorPalettePicker from "../../../../shared/components/ui/ColorPalettePicker"
import { normalizeColor, PALETTE_COLORS } from "../../../../shared/utils/colorPickerUtils"

type Props = {
    editor: Editor
}

const DEFAULT_HIGHLIGHT_COLOR = "#f1c232"

export default function HighlightColorPicker({ editor }: Props) {
    const [selectedColor, setSelectedColor] = useState(DEFAULT_HIGHLIGHT_COLOR)

    useEffect(() => {
        const sync = () => {
            const attrs = editor.getAttributes("highlight") as { color?: string }
            setSelectedColor(normalizeColor(attrs.color, DEFAULT_HIGHLIGHT_COLOR))
        }

        sync()
        editor.on("selectionUpdate", sync)
        editor.on("transaction", sync)

        return () => {
            editor.off("selectionUpdate", sync)
            editor.off("transaction", sync)
        }
    }, [editor])

    function applyColor(color: string) {
        editor.chain().focus().setHighlight({ color }).run()
        setSelectedColor(color)
    }

    return (
        <ColorPalettePicker
            ariaLabel="Textmarker"
            title="Textmarker"
            selectedColor={selectedColor}
            paletteColors={PALETTE_COLORS}
            onSelectColor={applyColor}
            triggerContent={
                <span className="flex flex-col items-center leading-none">
                    <Highlighter className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
                    <span className="mt-0.5 h-0.5 w-4 rounded-sm" style={{ backgroundColor: selectedColor }} />
                </span>
            }
        />
    )
}
