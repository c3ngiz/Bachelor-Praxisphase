/** Props for the loading spinner component. */
export interface LoadingSpinnerProps {
  /** Accessible label for the loading state. */
  label?: string;
}

/** Displays a simple loading indicator for pending UI states. */
export function LoadingSpinner({ label = 'Loading' }: LoadingSpinnerProps): JSX.Element {
  return <span aria-live="polite">{label}...</span>;
}
