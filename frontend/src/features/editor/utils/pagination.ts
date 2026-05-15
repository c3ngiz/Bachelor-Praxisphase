import type { CSSProperties } from 'react';

/** DIN A4 page width in millimeters. */
export const A4_PAGE_WIDTH_MM = 210;

/** DIN A4 page height in millimeters. */
export const A4_PAGE_HEIGHT_MM = 297;

/** Browser CSS pixel conversion for print millimeters. */
const CSS_PIXELS_PER_MM = 96 / 25.4;

/** A4 page height in CSS pixels. */
export const A4_PAGE_HEIGHT_PX = A4_PAGE_HEIGHT_MM * CSS_PIXELS_PER_MM;

/** Gap between stacked visual pages in CSS pixels. */
export const A4_PAGE_GAP_PX = 24;

/**
 * Calculates the total visual stack height for A4 pages.
 *
 * The value is computed in TypeScript instead of CSS `calc()` multiplication
 * because browser support for multiplication in CSS math is still inconsistent.
 *
 * @param pageCount - Number of rendered visual pages.
 * @returns Stack height in CSS pixels.
 */
export function calculateA4PageStackHeight(pageCount: number): number {
  const normalizedCount = Math.max(1, Math.floor(pageCount));
  return normalizedCount * A4_PAGE_HEIGHT_PX + (normalizedCount - 1) * A4_PAGE_GAP_PX;
}

/**
 * Calculates the top offset for a stacked A4 page.
 *
 * @param pageIndex - Zero-based page index.
 * @returns Page offset in CSS pixels.
 */
export function calculateA4PageOffset(pageIndex: number): number {
  return Math.max(0, pageIndex) * (A4_PAGE_HEIGHT_PX + A4_PAGE_GAP_PX);
}

/**
 * Calculates how many visual A4 pages are needed for measured editor content.
 *
 * This is intentionally visual pagination. It does not insert hard page-break
 * nodes into the TipTap document, which keeps future CRDT collaboration simple.
 *
 * @param contentHeightPx - Measured editor content height in CSS pixels.
 * @returns At least one visual A4 page.
 */
export function calculateA4PageCount(contentHeightPx: number): number {
  if (!Number.isFinite(contentHeightPx) || contentHeightPx <= 0) {
    return 1;
  }

  return Math.max(1, Math.ceil(contentHeightPx / A4_PAGE_HEIGHT_PX));
}

/**
 * Measures the occupied height of a ProseMirror root independent of min-height.
 *
 * @param root - ProseMirror editable root.
 * @returns Content height including editor padding.
 */
export function measureEditorContentHeight(root: HTMLElement): number {
  const styles = window.getComputedStyle(root);
  const paddingBottom = Number.parseFloat(styles.paddingBottom) || 0;
  const children = Array.from(root.children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement,
  );

  if (children.length === 0) {
    return root.scrollHeight;
  }

  const contentBottom = children.reduce(
    (bottom, child) => Math.max(bottom, child.offsetTop + child.offsetHeight),
    0,
  );

  return contentBottom + paddingBottom;
}

/**
 * Builds an inline offset style for a stacked visual A4 page.
 *
 * @param pageIndex - Zero-based page index.
 * @returns CSS transform positioning the background sheet.
 */
export function getA4PageOffsetStyle(pageIndex: number): CSSProperties {
  return {
    transform: `translateY(${calculateA4PageOffset(pageIndex)}px)`,
  };
}
