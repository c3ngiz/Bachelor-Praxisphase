import { RangeSetBuilder, StateEffect, StateField } from '@codemirror/state';
import { Decoration, type DecorationSet, EditorView, WidgetType } from '@codemirror/view';

import { codePointOffsetToCodeUnitOffset } from '../utils/otTransform';
import type { CursorState } from '../types/editor.types';

export const setRemoteCursorsEffect = StateEffect.define<CursorState[]>();

export const remoteCursorField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(decorations, transaction) {
    for (const effect of transaction.effects) {
      if (effect.is(setRemoteCursorsEffect)) {
        return buildRemoteCursorDecorations(transaction.state.doc.toString(), effect.value);
      }
    }

    return decorations.map(transaction.changes);
  },
  provide(field) {
    return EditorView.decorations.from(field);
  },
});

function buildRemoteCursorDecorations(content: string, cursors: CursorState[]): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const ranges: Array<{ from: number; to: number; decoration: Decoration }> = [];

  for (const cursor of cursors) {
    const selectionStart = codePointOffsetToCodeUnitOffset(content, cursor.selection_start);
    const selectionEnd = codePointOffsetToCodeUnitOffset(content, cursor.selection_end);
    const cursorPosition = codePointOffsetToCodeUnitOffset(content, cursor.pos);
    const from = Math.min(selectionStart, selectionEnd);
    const to = Math.max(selectionStart, selectionEnd);

    if (to > from) {
      ranges.push({
        decoration: Decoration.mark({
          attributes: {
            style: `background-color: ${hexToRgba(cursor.color, 0.18)}`,
          },
          class: 'cm-remote-selection',
        }),
        from,
        to,
      });
    }

    ranges.push({
      decoration: Decoration.widget({
        side: 1,
        widget: new RemoteCursorWidget(cursor),
      }),
      from: cursorPosition,
      to: cursorPosition,
    });
  }

  ranges
    .sort((left, right) => left.from - right.from || left.to - right.to)
    .forEach((range) => builder.add(range.from, range.to, range.decoration));

  return builder.finish();
}

class RemoteCursorWidget extends WidgetType {
  constructor(private readonly cursor: CursorState) {
    super();
  }

  toDOM(): HTMLElement {
    const wrapper = document.createElement('span');
    wrapper.className = 'cm-remote-cursor';
    wrapper.style.borderLeftColor = this.cursor.color;
    wrapper.title = this.cursor.display_name;

    const label = document.createElement('span');
    label.className = 'cm-remote-cursor__label';
    label.style.backgroundColor = this.cursor.color;
    label.textContent = this.cursor.display_name;

    wrapper.append(label);
    return wrapper;
  }
}

function hexToRgba(color: string, alpha: number): string {
  const normalized = color.replace('#', '');

  if (normalized.length !== 6) {
    return `rgba(37, 99, 235, ${alpha})`;
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
