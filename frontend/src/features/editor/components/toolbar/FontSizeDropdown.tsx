import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import Select from "@/shared/components/ui/Select";

type Props = {
    editor: Editor;
};

type FontSizeOption = "12px" | "14px" | "16px" | "18px" | "24px";

const DEFAULT_SIZE: FontSizeOption = "16px";

const options: { value: FontSizeOption; label: string }[] = [
    { value: "12px", label: "12 px" },
    { value: "14px", label: "14 px" },
    { value: "16px", label: "16 px" },
    { value: "18px", label: "18 px" },
    { value: "24px", label: "24 px" },
];

function normalizeFontSize(value: string | undefined): FontSizeOption {
    if (!value) return DEFAULT_SIZE;

    const normalized = value.replace(/[\s'"]/g, "").toLowerCase();
    const matched = options.find((option) => option.value.toLowerCase() === normalized);

    return matched?.value ?? DEFAULT_SIZE;
}

export default function FontSizeDropdown({ editor }: Props) {
    const [selectedFontSize, setSelectedFontSize] = useState<FontSizeOption>(DEFAULT_SIZE);

    useEffect(() => {
        const sync = () => {
            const attrs = editor.getAttributes("textStyle") as { fontSize?: string };
            setSelectedFontSize(normalizeFontSize(attrs.fontSize));
        };

        sync();

        editor.on("selectionUpdate", sync);
        editor.on("transaction", sync);

        return () => {
            editor.off("selectionUpdate", sync);
            editor.off("transaction", sync);
        };
    }, [editor]);

    function handleChange(value: FontSizeOption) {
        editor.commands.setFontSize(value);
        setSelectedFontSize(value);
    }

    return (
        <Select
            aria-label="Textgroesse"
            value={selectedFontSize}
            onChange={(event) => handleChange(event.target.value as FontSizeOption)}
            options={options}
            className="min-w-32"
        />
    );
}
