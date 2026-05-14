import { forwardRef, type ReactNode, type TextareaHTMLAttributes } from 'react';

import { cn } from '../../utils';
import { Field } from '../Field';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  description?: ReactNode;
  error?: ReactNode;
  label?: ReactNode;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, description, error, id, label, name, required, ...props },
  ref,
) {
  const fieldId = id ?? name;

  return (
    <Field.Root id={fieldId} error={error} required={required}>
      {label ? <Field.Label>{label}</Field.Label> : null}
      <Field.Control>
        <textarea
          ref={ref}
          name={name}
          required={required}
          className={cn(
            'min-h-24 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm transition-colors',
            'placeholder:text-slate-400 focus:border-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-950/10',
            'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
            Boolean(error) && 'border-red-500 focus:border-red-600 focus:ring-red-600/10',
            className,
          )}
          {...props}
        />
      </Field.Control>
      {description ? <Field.Description>{description}</Field.Description> : null}
      <Field.Error />
    </Field.Root>
  );
});

export default Textarea;
