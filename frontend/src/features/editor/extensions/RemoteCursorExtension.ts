import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Editor } from "@tiptap/react";
import type { RemoteCursor } from "../services/documentSync";

export const remoteCursorPluginKey = new PluginKey<RemoteCursor[]>("remote-cursors");

function getCursorColor(color: string): string {
  if (color.startsWith("#") || color.startsWith("rgb") || color.startsWith("hsl")) {
    return color;
  }

  return "#4943be";
}

function createCursorWidget(cursor: RemoteCursor): HTMLElement {
  const wrapper = document.createElement("span");
  const color = getCursorColor(cursor.user.color);
  wrapper.style.borderLeft = `2px solid ${color}`;
  wrapper.style.marginLeft = "-1px";
  wrapper.style.marginRight = "-1px";
  wrapper.style.position = "relative";
  wrapper.style.pointerEvents = "none";
  wrapper.style.zIndex = "20";

  const label = document.createElement("span");
  label.textContent = cursor.user.name;
  label.style.position = "absolute";
  label.style.left = "-2px";
  label.style.top = "-1.45rem";
  label.style.maxWidth = "10rem";
  label.style.overflow = "hidden";
  label.style.textOverflow = "ellipsis";
  label.style.whiteSpace = "nowrap";
  label.style.borderRadius = "0.375rem";
  label.style.background = color;
  label.style.color = "white";
  label.style.fontSize = "11px";
  label.style.fontWeight = "700";
  label.style.lineHeight = "1";
  label.style.padding = "0.25rem 0.4rem";
  label.style.boxShadow = "0 8px 18px rgba(3, 6, 24, 0.18)";

  wrapper.appendChild(label);
  return wrapper;
}

export function setRemoteCursors(editor: Editor | null, cursors: RemoteCursor[]): void {
  if (!editor) {
    return;
  }

  editor.view.dispatch(editor.state.tr.setMeta(remoteCursorPluginKey, cursors));
}

export const RemoteCursorExtension = Extension.create({
  name: "remoteCursors",

  addProseMirrorPlugins() {
    return [
      new Plugin<RemoteCursor[]>({
        key: remoteCursorPluginKey,
        state: {
          init: () => [],
          apply(transaction, currentCursors) {
            const nextCursors = transaction.getMeta(remoteCursorPluginKey) as
              | RemoteCursor[]
              | undefined;

            return nextCursors ?? currentCursors;
          },
        },
        props: {
          decorations(state) {
            const cursors = remoteCursorPluginKey.getState(state) ?? [];
            const maxPosition = state.doc.content.size;
            const decorations = cursors.map((cursor) => {
              const position = Math.max(1, Math.min(cursor.head, maxPosition));
              return Decoration.widget(position, () => createCursorWidget(cursor), {
                key: cursor.user.id,
                side: 1,
              });
            });

            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});
