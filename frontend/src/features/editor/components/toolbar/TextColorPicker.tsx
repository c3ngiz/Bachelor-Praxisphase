import { useEffect, useState } from "react"
import type { Editor } from "@tiptap/react"
import ColorPalettePicker from "../../../../shared/components/ui/ColorPalettePicker"
import { normalizeColor, PALETTE_COLORS } from "../../../../shared/utils/colorPickerUtils"

type Props = {
    editor: Editor
}

const DEFAULT_TEXT_COLOR = "#000000"

export default function TextColorPicker({ editor }: Props) {
    const [selectedColor, setSelectedColor] = useState(DEFAULT_TEXT_COLOR)

    useEffect(() => {
        const sync = () => {
            const attrs = editor.getAttributes("textStyle") as { color?: string }
            setSelectedColor(normalizeColor(attrs.color, DEFAULT_TEXT_COLOR))
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
        editor.chain().focus().setColor(color).run()
        setSelectedColor(color)
    }

    return (
        <ColorPalettePicker
            ariaLabel="Textfarbe"
            title="Textfarbe"
            selectedColor={selectedColor}
            paletteColors={PALETTE_COLORS}
            onSelectColor={applyColor}
            triggerContent={
                <span className="flex flex-col items-center leading-none">
                    <span className="text-base font-semibold">A</span>
                    <span className="mt-0.5 h-0.5 w-4 rounded-sm" style={{ backgroundColor: selectedColor }} />
                </span>
            }
        />
    )
}
