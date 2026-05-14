import type { ReactNode } from 'react';

import {
  A4_PAGE_GAP_PX,
  A4_PAGE_HEIGHT_MM,
  A4_PAGE_MARGIN_MM,
  A4_PAGE_WIDTH_MM,
} from '../utils/pagination';

/** Props for the A4 page wrapper. */
export interface A4PageProps {
  /** TipTap editor content rendered inside the visual page. */
  children: ReactNode;
}

/**
 * Renders the white A4 editing surface and page-break styling.
 *
 * The editor itself remains one ProseMirror document. Page breaks are
 * decoration widgets inserted by `A4PaginationExtension`, so stored content is
 * not polluted with layout-only nodes.
 */
export function A4Page({ children }: A4PageProps): JSX.Element {
  return (
    <div
      className="docflow-a4-page bg-white text-slate-950 shadow-[0_8px_30px_rgba(15,23,42,0.12)]"
      style={{
        minHeight: `${A4_PAGE_HEIGHT_MM}mm`,
        paddingBottom: `${A4_PAGE_MARGIN_MM.bottom}mm`,
        paddingLeft: `${A4_PAGE_MARGIN_MM.left}mm`,
        paddingRight: `${A4_PAGE_MARGIN_MM.right}mm`,
        paddingTop: `${A4_PAGE_MARGIN_MM.top}mm`,
        width: `${A4_PAGE_WIDTH_MM}mm`,
      }}
    >
      <style>{`
        .docflow-a4-page .docflow-prosemirror {
          min-height: ${A4_PAGE_HEIGHT_MM - A4_PAGE_MARGIN_MM.top - A4_PAGE_MARGIN_MM.bottom}mm;
          outline: none;
          overflow-wrap: anywhere;
          line-height: 1.65;
        }

        .docflow-a4-page .docflow-prosemirror p {
          margin: 0 0 0.8rem;
        }

        .docflow-a4-page .docflow-prosemirror h1 {
          font-size: 2rem;
          font-weight: 700;
          line-height: 1.2;
          margin: 0 0 1rem;
        }

        .docflow-a4-page .docflow-prosemirror h2 {
          font-size: 1.5rem;
          font-weight: 700;
          line-height: 1.25;
          margin: 1.4rem 0 0.8rem;
        }

        .docflow-a4-page .docflow-prosemirror ul,
        .docflow-a4-page .docflow-prosemirror ol {
          margin: 0 0 0.8rem;
          padding-left: 1.5rem;
        }

        .docflow-a4-page .docflow-prosemirror img {
          display: block;
          height: auto;
          max-width: 100%;
        }

        .docflow-a4-page .collaboration-carets__caret {
          border-left: 2px solid;
          border-right: 2px solid;
          margin-left: -1px;
          margin-right: -1px;
          pointer-events: none;
          position: relative;
          word-break: normal;
        }

        .docflow-a4-page .collaboration-carets__label {
          border-radius: 4px;
          color: white;
          font-size: 11px;
          font-weight: 600;
          left: -2px;
          line-height: 1;
          padding: 3px 5px;
          position: absolute;
          top: -1.45em;
          user-select: none;
          white-space: nowrap;
        }

        .docflow-a4-page .docflow-page-break {
          background: #e5e7eb;
          box-shadow:
            inset 0 1px 0 rgba(15, 23, 42, 0.08),
            inset 0 -1px 0 rgba(15, 23, 42, 0.08);
          height: ${A4_PAGE_GAP_PX}px;
          margin: 18px -${A4_PAGE_MARGIN_MM.right}mm 18px -${A4_PAGE_MARGIN_MM.left}mm;
          pointer-events: none;
        }
      `}</style>
      {children}
    </div>
  );
}
