import type { ReactNode } from 'react';

/** Props for an editor sidebar section. */
export interface EditorSidebarSectionProps {
  /** Section controls or status rows. */
  children: ReactNode;
  /** Optional supporting text. */
  description?: string;
  /** Section title. */
  title: string;
}

/**
 * Groups related editor controls inside the left sidebar.
 *
 * @param props - Sidebar section props.
 * @returns Labeled sidebar section.
 */
export function EditorSidebarSection({
  children,
  description,
  title,
}: EditorSidebarSectionProps): JSX.Element {
  return (
    <section className="editor-sidebar-section" aria-label={title}>
      <div className="mb-2">
        <h2 className="m-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </h2>
        {description ? <p className="m-0 mt-1 text-xs text-slate-500">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
