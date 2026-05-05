/** Props for the empty state component. */
export interface EmptyStateProps {
  /** Empty state heading. */
  title: string;
  /** Optional supporting message. */
  message?: string;
}

/** Displays a reusable empty state message. */
export function EmptyState({ title, message }: EmptyStateProps): JSX.Element {
  return (
    <section aria-label={title}>
      <h2>{title}</h2>
      {message ? <p>{message}</p> : null}
    </section>
  );
}
