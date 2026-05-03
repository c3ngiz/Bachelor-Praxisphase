import BulletList from "@tiptap/extension-bullet-list";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import OrderedList from "@tiptap/extension-ordered-list";
import TextAlign from "@tiptap/extension-text-align";
import FontSize from "@tiptap/extension-text-style/font-size";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import type { Extensions } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import type { Doc } from "yjs";
import type { HocuspocusProvider } from "@hocuspocus/provider";

type CollaborationUser = {
  name: string;
  color: string;
};

type EditorExtensionOptions =
  | {
      mode: "polling";
    }
  | {
      mode: "collaboration";
      document: Doc;
      provider: HocuspocusProvider;
      user: CollaborationUser;
    };

function createBaseExtensions(includeUndoRedo: boolean): Extensions {
  return [
    StarterKit.configure({
      bulletList: false,
      orderedList: false,
      undoRedo: includeUndoRedo ? undefined : false,
    }),
    BulletList.configure({
      keepMarks: true,
      keepAttributes: false,
    }),
    OrderedList.configure({
      keepMarks: true,
      keepAttributes: false,
    }),
    TextStyle,
    Color,
    Highlight.configure({
      multicolor: true,
    }),
    Image,
    Link.configure({
      openOnClick: false,
    }),
    Underline,
    FontFamily,
    FontSize,
    TextAlign.configure({
      types: ["heading", "paragraph"],
    }),
  ];
}

export function createEditorExtensions(options: EditorExtensionOptions): Extensions {
  const extensions = createBaseExtensions(options.mode === "polling");

  if (options.mode === "collaboration") {
    extensions.push(
      Collaboration.configure({
        document: options.document,
        provider: options.provider,
        field: "default",
      }),
      CollaborationCaret.configure({
        provider: options.provider,
        user: options.user,
      }),
    );
  }

  return extensions;
}
