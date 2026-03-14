import { Editor } from "@tiptap/react"
import Divider from "@/shared/components/ui/Divider"
import FontFamilyDropdown from "./toolbar/FontFamilyDropdown"
import FontSizeDropdown from "./toolbar/FontSizeDropdown"
import TextStyleDropdown from "./toolbar/TextStyleDropdown"

type Props = {
    editor: Editor | null
}

export default function EditorToolbar({ editor }: Props) {
    if (!editor) return null

    return (
        <div className="w-full border-b border-(--border) bg-(--bg-elevated)">
            <div className="flex w-full items-center overflow-x-auto px-2 py-1">
                <div className="flex w-full min-w-max items-center gap-2 md:gap-3">
                    <div className="w-44 shrink-0">
                        <TextStyleDropdown editor={editor} />
                    </div>

                    <Divider vertical className="h-8 shrink-0" />

                    <div className="w-44 shrink-0">
                        <FontFamilyDropdown editor={editor} />
                    </div>

                    <div className="w-32 shrink-0">
                        <FontSizeDropdown editor={editor} />
                    </div>
                </div>
            </div>
        </div>
    )
}