import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import Select from "@/shared/components/ui/Select";

type Props = {
    editor: Editor;
};

type FontFamilyOption = "Arial" | "Times New Roman" | "Georgia" | "Verdana" | "Courier New";

const DEFAULT_FONT: FontFamilyOption = "Arial";

const options: { value: FontFamilyOption; label: string }[] = [
    { value: "Arial", label: "Arial" },
    { value: "Times New Roman", label: "Times New Roman" },
    { value: "Georgia", label: "Georgia" },
    { value: "Verdana", label: "Verdana" },
    { value: "Courier New", label: "Courier New" },
];

function normalizeFontFamily(value: string | undefined): FontFamilyOption {
    if (!value) return DEFAULT_FONT;

    const normalized = value.replace(/['"]/g, "").toLowerCase();
    const matched = options.find((option) => option.value.toLowerCase() === normalized);

    return matched?.value ?? DEFAULT_FONT;
}

export default function FontFamilyDropdown({ editor }: Props) {
    const [selectedFontFamily, setSelectedFontFamily] = useState<FontFamilyOption>(DEFAULT_FONT);

    useEffect(() => {
        const sync = () => {
            const attrs = editor.getAttributes("textStyle") as { fontFamily?: string };
            setSelectedFontFamily(normalizeFontFamily(attrs.fontFamily));
        };

        sync();

        editor.on("selectionUpdate", sync);
        editor.on("transaction", sync);

        return () => {
            editor.off("selectionUpdate", sync);
            editor.off("transaction", sync);
        };
    }, [editor]);

    function handleChange(value: FontFamilyOption) {
        editor.chain().focus().setFontFamily(value).run();
        setSelectedFontFamily(value);
    }

    return (
        <Select
            aria-label="Schriftart"
            value={selectedFontFamily}
            onChange={(event) => handleChange(event.target.value as FontFamilyOption)}
            options={options}
            className="min-w-44"
        />
    );
}
