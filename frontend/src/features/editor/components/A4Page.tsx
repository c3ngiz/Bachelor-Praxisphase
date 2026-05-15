import { getA4PageOffsetStyle } from '../utils/pagination';

/** Props for a visual DIN A4 page background. */
export interface A4PageProps {
  /** Zero-based visual page index. */
  pageIndex: number;
}

/**
 * Renders one non-editable A4 sheet behind the TipTap editing surface.
 *
 * @param props - Page background props.
 * @returns A positioned visual page.
 */
export function A4Page({ pageIndex }: A4PageProps): JSX.Element {
  return (
    <div
      aria-hidden="true"
      className="editor-a4-page"
      style={getA4PageOffsetStyle(pageIndex)}
    />
  );
}
