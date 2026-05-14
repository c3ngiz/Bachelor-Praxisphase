import { Decoration } from '@tiptap/pm/view';
import type { EditorView } from '@tiptap/pm/view';

/** A4 page width in millimeters. */
export const A4_PAGE_WIDTH_MM = 210;

/** A4 page height in millimeters. */
export const A4_PAGE_HEIGHT_MM = 297;

/** First-version top/right/bottom/left page margins in millimeters. */
export const A4_PAGE_MARGIN_MM = {
  bottom: 22,
  left: 20,
  right: 20,
  top: 22,
} as const;

/** Visual space inserted between overflow pages. */
export const A4_PAGE_GAP_PX = 32;

const cssPixelsPerInch = 96;
const millimetersPerInch = 25.4;

/**
 * Converts millimeters to browser CSS pixels.
 *
 * @param millimeters - Length in millimeters.
 * @returns Length in CSS pixels.
 */
export function millimetersToPixels(millimeters: number): number {
  return (millimeters / millimetersPerInch) * cssPixelsPerInch;
}

/**
 * Returns the available text content height inside the A4 margins.
 *
 * @returns A4 content height in CSS pixels.
 */
export function getA4ContentHeightPixels(): number {
  return millimetersToPixels(
    A4_PAGE_HEIGHT_MM - A4_PAGE_MARGIN_MM.top - A4_PAGE_MARGIN_MM.bottom,
  );
}

/**
 * Builds non-persisted page-break decorations from measured top-level node positions.
 *
 * This first pagination version intentionally does not split a single oversized
 * node. It inserts visual separators before top-level nodes that naturally flow
 * past the next A4 page boundary, keeping pagination logic isolated for later
 * replacement with a more exact layout engine.
 *
 * @param view - ProseMirror editor view.
 * @returns Page-break decorations.
 */
export function buildA4PageBreakDecorations(view: EditorView): Decoration[] {
  const decorations: Decoration[] = [];
  const rootRect = view.dom.getBoundingClientRect();
  const pageContentHeight = getA4ContentHeightPixels();
  let nextPageTop = pageContentHeight;
  let pageNumber = 2;

  view.state.doc.forEach((node, offset) => {
    const position = offset + 1;
    const dom = view.nodeDOM(position);

    if (!(dom instanceof HTMLElement)) {
      return;
    }

    const nodeTop = dom.getBoundingClientRect().top - rootRect.top;

    if (nodeTop < nextPageTop - 8) {
      return;
    }

    while (nodeTop >= nextPageTop - 8) {
      decorations.push(createA4PageBreakDecoration(position, pageNumber));
      nextPageTop += pageContentHeight + A4_PAGE_GAP_PX;
      pageNumber += 1;
    }

    void node;
  });

  return decorations;
}

/**
 * Creates one page-break widget decoration.
 *
 * @param position - ProseMirror document position before the overflowing node.
 * @param pageNumber - Visual page number represented by the break.
 * @returns Widget decoration.
 */
function createA4PageBreakDecoration(position: number, pageNumber: number): Decoration {
  return Decoration.widget(
    position,
    () => {
      const element = document.createElement('div');
      element.className = 'docflow-page-break';
      element.dataset.page = String(pageNumber);
      element.setAttribute('contenteditable', 'false');
      return element;
    },
    {
      key: `docflow-page-break-${pageNumber}-${position}`,
      side: -1,
    },
  );
}
