import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';

import { cn } from '../../utils';

/**
 * Props for the checkbox control.
 *
 * Optional label, description, and error text are wired to the checkbox through
 * generated ids so assistive technology receives the same context as sighted users.
 */
export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
};

/**
 * Renders an accessible checkbox with optional supporting text.
 *
 * @param props - Native checkbox props plus label, description, and error content.
 * @returns A checkbox field row.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, description, disabled, error, id, label, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex gap-3', disabled && 'opacity-60')}>
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-950',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed',
          className,
        )}
        {...props}
      />
      {(label || description || error) && (
        <div className="grid gap-1 text-sm leading-5">
          {label ? (
            <label htmlFor={inputId} className={cn('font-medium text-slate-900', disabled && 'cursor-not-allowed')}>
              {label}
            </label>
          ) : null}
          {description ? (
            <p id={descriptionId} className="m-0 text-slate-500">
              {description}
            </p>
          ) : null}
          {error ? (
            <p id={errorId} className="m-0 text-red-600">
              {error}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
});

/**
 * Default export for consumers that prefer default component imports.
 */
export default Checkbox;
