import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import Select from "@/shared/components/ui/Select";

type Props = {
	editor: Editor;
};

type TextStyleOption = "normal" | "title" | "subtitle" | "h1" | "h2" | "h3";

const TITLE_STYLE = { fontSize: "2rem", fontWeight: "700" };
const SUBTITLE_STYLE = { fontSize: "1.5rem", fontWeight: "600" };

const options: { value: TextStyleOption; label: string }[] = [
	{ value: "normal", label: "Normaler Text" },
	{ value: "title", label: "Titel" },
	{ value: "subtitle", label: "Untertitel" },
	{ value: "h1", label: "Überschrift 1" },
	{ value: "h2", label: "Überschrift 2" },
	{ value: "h3", label: "Überschrift 3" },
];

function getCurrentOption(editor: Editor): TextStyleOption {
	if (editor.isActive("heading", { level: 1 })) return "h1";
	if (editor.isActive("heading", { level: 2 })) return "h2";
	if (editor.isActive("heading", { level: 3 })) return "h3";

	const textStyleAttrs = editor.getAttributes("textStyle") as {
		fontSize?: string;
		fontWeight?: string;
	};

	if (textStyleAttrs.fontSize === TITLE_STYLE.fontSize && textStyleAttrs.fontWeight === TITLE_STYLE.fontWeight) {
		return "title";
	}

	if (textStyleAttrs.fontSize === SUBTITLE_STYLE.fontSize && textStyleAttrs.fontWeight === SUBTITLE_STYLE.fontWeight) {
		return "subtitle";
	}

	return "normal";
}

export default function TextStyleDropdown({ editor }: Props) {
	const [selectedStyle, setSelectedStyle] = useState<TextStyleOption>("normal");

	useEffect(() => {
		const sync = () => setSelectedStyle(getCurrentOption(editor));

		sync();

		editor.on("selectionUpdate", sync);
		editor.on("transaction", sync);

		return () => {
			editor.off("selectionUpdate", sync);
			editor.off("transaction", sync);
		};
	}, [editor]);

	function handleChange(value: TextStyleOption) {
		switch (value) {
			case "normal": {
				editor.chain().focus().setParagraph().unsetMark("textStyle").run();
				break;
			}
			case "title": {
				editor.chain().focus().setParagraph().setMark("textStyle", TITLE_STYLE).run();
				break;
			}
			case "subtitle": {
				editor.chain().focus().setParagraph().setMark("textStyle", SUBTITLE_STYLE).run();
				break;
			}
			case "h1": {
				editor.chain().focus().setHeading({ level: 1 }).unsetMark("textStyle").run();
				break;
			}
			case "h2": {
				editor.chain().focus().setHeading({ level: 2 }).unsetMark("textStyle").run();
				break;
			}
			case "h3": {
				editor.chain().focus().setHeading({ level: 3 }).unsetMark("textStyle").run();
				break;
			}
			default:
				break;
		}

		setSelectedStyle(value);
	}

	return (
		<Select
			aria-label="Textstil"
			value={selectedStyle}
			onChange={(event) => handleChange(event.target.value as TextStyleOption)}
			options={options}
			className="min-w-44"
		/>
	);
}
