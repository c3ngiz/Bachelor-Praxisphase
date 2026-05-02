import type { ReactNode } from "react";
import type { Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  List,
  ListOrdered,
  Underline,
} from "lucide-react";

import { Divider } from "@/shared/components/ui";
import { cn } from "@/shared/lib/ui/cn";
import FontFamilyDropdown from "./toolbar/FontFamilyDropdown";
import FontSizeDropdown from "./toolbar/FontSizeDropdown";
import HighlightColorPicker from "./toolbar/HighlightColorPicker";
import TextColorPicker from "./toolbar/TextColorPicker";
import TextStyleDropdown from "./toolbar/TextStyleDropdown";
import ToolbarIconButton from "./toolbar/ToolbarIconButton";

type Props = {
  editor: Editor | null;
};

type ToolbarGroupProps = {
  children: ReactNode;
  className?: string;
};

function ToolbarGroup({ children, className }: ToolbarGroupProps) {
  return (
    <div className={cn("flex shrink-0 items-center gap-1", className)}>
      {children}
    </div>
  );
}

function TextFormatGroup({ editor }: { editor: Editor }) {
  return (
    <ToolbarGroup>
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
    </ToolbarGroup>
  );
}

function ListGroup({ editor }: { editor: Editor }) {
  return (
    <ToolbarGroup>
      <ToolbarIconButton
        label="Aufzaehlung"
        isActive={editor.isActive("bulletList")}
        onPress={() => editor.chain().focus().toggleBulletList().run()}
        icon={List}
      />

      <ToolbarIconButton
        label="Nummerierte Liste"
        isActive={editor.isActive("orderedList")}
        onPress={() => editor.chain().focus().toggleOrderedList().run()}
        icon={ListOrdered}
      />
    </ToolbarGroup>
  );
}

function AlignmentGroup({ editor }: { editor: Editor }) {
  return (
    <ToolbarGroup>
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
    </ToolbarGroup>
  );
}

export default function EditorToolbar({ editor }: Props) {
  if (!editor) return null;

  return (
    <div className="border-b border-(--border) bg-(--bg-subtle)/95 px-4 py-2 sm:px-6">
      <div className="mx-auto flex max-w-7xl justify-center overflow-x-auto overflow-y-visible">
        <div className="inline-flex min-w-max items-center gap-2 px-1">
          <ToolbarGroup className="w-44">
            <TextStyleDropdown editor={editor} />
          </ToolbarGroup>

          <Divider vertical className="h-7 shrink-0" />

          <ToolbarGroup className="w-44">
            <FontFamilyDropdown editor={editor} />
          </ToolbarGroup>

          <ToolbarGroup className="w-32">
            <FontSizeDropdown editor={editor} />
          </ToolbarGroup>

          <Divider vertical className="h-7 shrink-0" />

          <TextFormatGroup editor={editor} />

          <Divider vertical className="h-7 shrink-0" />

          <ListGroup editor={editor} />

          <Divider vertical className="h-7 shrink-0" />

          <AlignmentGroup editor={editor} />
        </div>
      </div>
    </div>
  );
}
