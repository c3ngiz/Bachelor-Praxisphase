import { forwardRef, type ReactNode, type SelectHTMLAttributes } from 'react';

import { cn } from '../../utils';
import { Field } from '../Field';

/**
 * Option descriptor rendered by the shared select field.
 */
export type SelectOption = {
  disabled?: boolean;
  label: string;
  value: string;
};

/**
 * Props for the shared select field.
 *
 * `options` supports data-driven rendering while `children` remains available
 * for custom option groups or specialized markup.
 */
export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  description?: ReactNode;
  error?: ReactNode;
  label?: ReactNode;
  options?: SelectOption[];
  placeholder?: string;
  startAdornment?: ReactNode;
};

/**
 * Renders a labeled select with optional placeholder, options, and adornment.
 *
 * @param props - Native select props plus field metadata and option descriptors.
 * @returns Accessible select field.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    children,
    className,
    description,
    error,
    id,
    label,
    name,
    options,
    placeholder,
    required,
    startAdornment,
    ...props
  },
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
          <select
            ref={ref}
            name={name}
            required={required}
            className={cn(
              'h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 pr-9 text-sm text-slate-950 shadow-sm transition-colors',
              'focus:border-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-950/10',
              'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
              Boolean(error) && 'border-red-500 focus:border-red-600 focus:ring-red-600/10',
              Boolean(startAdornment) && 'pl-10',
              className,
            )}
            {...props}
          >
            {placeholder ? (
              <option value="" disabled>
                {placeholder}
              </option>
            ) : null}
            {options?.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
            {children}
          </select>
        </Field.Control>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400" aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
            <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
          </svg>
        </span>
      </div>
      {description ? <Field.Description>{description}</Field.Description> : null}
      <Field.Error />
    </Field.Root>
  );
});

/**
 * Default export for consumers that prefer default component imports.
 */
export default Select;
