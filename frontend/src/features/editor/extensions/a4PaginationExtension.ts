import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { DecorationSet } from '@tiptap/pm/view';
import type { EditorView } from '@tiptap/pm/view';

import { buildA4PageBreakDecorations } from '../utils/pagination';

const paginationPluginKey = new PluginKey<DecorationSet>('docflowA4Pagination');

/**
 * TipTap extension that inserts visual, non-persisted A4 page-break widgets.
 *
 * The implementation measures rendered top-level blocks and creates
 * decorations where content has crossed the next A4 page boundary. It is a
 * pragmatic v1 approximation: it never mutates the document and can be
 * replaced later without changing stored document content.
 */
export const A4PaginationExtension = Extension.create({
  name: 'a4Pagination',

  addProseMirrorPlugins() {
    let frame: number | null = null;

    const schedulePagination = (view: EditorView): void => {
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
      }

      frame = window.requestAnimationFrame(() => {
        frame = null;
        const decorations = DecorationSet.create(
          view.state.doc,
          buildA4PageBreakDecorations(view),
        );
        const transaction = view.state.tr.setMeta(paginationPluginKey, decorations);
        transaction.setMeta('addToHistory', false);
        view.dispatch(transaction);
      });
    };

    return [
      new Plugin<DecorationSet>({
        key: paginationPluginKey,
        props: {
          decorations(state) {
            return paginationPluginKey.getState(state);
          },
        },
        state: {
          apply(transaction, value) {
            const nextDecorations = transaction.getMeta(paginationPluginKey) as
              | DecorationSet
              | undefined;

            if (nextDecorations) {
              return nextDecorations;
            }

            if (transaction.docChanged) {
              return value.map(transaction.mapping, transaction.doc);
            }

            return value;
          },
          init() {
            return DecorationSet.empty;
          },
        },
        view(view) {
          const handleResize = (): void => schedulePagination(view);
          schedulePagination(view);
          window.addEventListener('resize', handleResize);

          return {
            destroy() {
              if (frame !== null) {
                window.cancelAnimationFrame(frame);
              }

              window.removeEventListener('resize', handleResize);
            },
            update(nextView, previousState) {
              if (
                previousState.doc !== nextView.state.doc ||
                previousState.selection !== nextView.state.selection
              ) {
                schedulePagination(nextView);
              }
            },
          };
        },
      }),
    ];
  },
});
