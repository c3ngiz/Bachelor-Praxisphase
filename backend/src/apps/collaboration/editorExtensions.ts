import BulletList from "@tiptap/extension-bullet-list";
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
import StarterKit from "@tiptap/starter-kit";
import type { Extensions } from "@tiptap/core";

export const collaborationEditorExtensions: Extensions = [
  StarterKit.configure({
    bulletList: false,
    orderedList: false,
    undoRedo: false,
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
