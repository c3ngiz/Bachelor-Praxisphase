import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

import { cn } from '../../utils';
import { Field } from '../Field';

/**
 * Props for the shared text input field.
 *
 * The component composes `Field` so labels, descriptions, and errors are
 * connected to the input through generated accessible ids.
 */
export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  description?: ReactNode;
  endAdornment?: ReactNode;
  error?: ReactNode;
  label?: ReactNode;
  startAdornment?: ReactNode;
};

/**
 * Renders a labeled input with optional adornments and validation state.
 *
 * @param props - Native input props plus field label, description, error, and adornments.
 * @returns Accessible text input field.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, description, endAdornment, error, id, label, name, required, startAdornment, ...props },
  ref,
) {
  const fieldId = id ?? name;

  return (
    <Field.Root id={fieldId} error={error} required={required}>
      {label ? <Field.Label>{label}</Field.Label> : null}
      <div className="relative">
        {startAdornment ? (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            {startAdornment}
          </span>
        ) : null}
        <Field.Control>
          <input
            ref={ref}
            name={name}
            required={required}
            className={cn(
              'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm transition-colors',
              'placeholder:text-slate-400 focus:border-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-950/10',
              'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
              Boolean(error) && 'border-red-500 focus:border-red-600 focus:ring-red-600/10',
              Boolean(startAdornment) && 'pl-10',
              Boolean(endAdornment) && 'pr-10',
              className,
            )}
            {...props}
          />
        </Field.Control>
        {endAdornment ? (
          <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">{endAdornment}</span>
        ) : null}
      </div>
      {description ? <Field.Description>{description}</Field.Description> : null}
      <Field.Error />
    </Field.Root>
  );
});

/**
 * Default export for consumers that prefer default component imports.
 */
export default Input;
