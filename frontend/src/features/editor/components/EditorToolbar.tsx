import { Editor } from "@tiptap/react"
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Italic, Underline } from "lucide-react"
import Divider from "@/shared/components/ui/Divider"
import FontFamilyDropdown from "./toolbar/FontFamilyDropdown"
import FontSizeDropdown from "./toolbar/FontSizeDropdown"
import HighlightColorPicker from "./toolbar/HighlightColorPicker.tsx"
import TextColorPicker from "./toolbar/TextColorPicker.tsx"
import TextStyleDropdown from "./toolbar/TextStyleDropdown"
import ToolbarIconButton from "./toolbar/ToolbarIconButton.tsx"

type Props = {
    editor: Editor | null
}

export default function EditorToolbar({ editor }: Props) {
    if (!editor) return null

    return (
        <div className="w-full border-b border-(--border) bg-(--bg-elevated)">
            <div className="flex w-full items-center overflow-x-auto overflow-y-visible px-2 py-1">
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

                    <Divider vertical className="h-8 shrink-0" />

                    <div className="flex items-center gap-1">
                        <ToolbarIconButton
                            label="Fett"
                            isActive={editor.isActive("bold")}
                            onPress={() => editor.chain().focus().toggleBold().run()}
                            icon={Bold}
                        />

                        <ToolbarIconButton
                            label="Kursiv"
                            isActive={editor.isActive("italic")}
                            onPress={() => editor.chain().focus().toggleItalic().run()}
                            icon={Italic}
                        />

                        <ToolbarIconButton
                            label="Unterstrichen"
                            isActive={editor.isActive("underline")}
                            onPress={() => editor.chain().focus().toggleUnderline().run()}
                            icon={Underline}
                        />

                        <TextColorPicker editor={editor} />
                        <HighlightColorPicker editor={editor} />
                    </div>

                    <Divider vertical className="h-8 shrink-0" />

                    <div className="flex items-center gap-1">
                        <ToolbarIconButton
                            label="Linksbündig"
                            isActive={editor.isActive({ textAlign: "left" })}
                            onPress={() => editor.chain().focus().setTextAlign("left").run()}
                            icon={AlignLeft}
                        />

                        <ToolbarIconButton
                            label="Zentriert"
                            isActive={editor.isActive({ textAlign: "center" })}
                            onPress={() => editor.chain().focus().setTextAlign("center").run()}
                            icon={AlignCenter}
                        />

                        <ToolbarIconButton
                            label="Rechtsbündig"
                            isActive={editor.isActive({ textAlign: "right" })}
                            onPress={() => editor.chain().focus().setTextAlign("right").run()}
                            icon={AlignRight}
                        />

                        <ToolbarIconButton
                            label="Blocksatz"
                            isActive={editor.isActive({ textAlign: "justify" })}
                            onPress={() => editor.chain().focus().setTextAlign("justify").run()}
                            icon={AlignJustify}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}