import {
  createContext,
  forwardRef,
  useContext,
  useId,
  type FieldsetHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';

import { cn } from '../../utils';

type RadioGroupContextValue = {
  descriptionId: string;
  error?: ReactNode;
  errorId: string;
  name?: string;
};

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

function useRadioGroupContext(component: string): RadioGroupContextValue {
  const context = useContext(RadioGroupContext);

  if (!context) {
    throw new Error(`${component} must be used within RadioGroup.Root`);
  }

  return context;
}

/**
 * Props for the radio group root.
 *
 * The root renders the fieldset/legend structure and shares error and group
 * name metadata with individual radio items.
 */
export type RadioGroupRootProps = FieldsetHTMLAttributes<HTMLFieldSetElement> & {
  description?: ReactNode;
  error?: ReactNode;
  label?: ReactNode;
  name?: string;
};

const RadioGroupRoot = forwardRef<HTMLFieldSetElement, RadioGroupRootProps>(function RadioGroupRoot(
  { children, className, description, disabled, error, label, name, ...props },
  ref,
) {
  const generatedId = useId();
  const descriptionId = `${generatedId}-description`;
  const errorId = `${generatedId}-error`;
  const describedBy = [description ? descriptionId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <RadioGroupContext.Provider value={{ descriptionId, error, errorId, name }}>
      <fieldset
        ref={ref}
        disabled={disabled}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        className={cn('grid gap-2 disabled:opacity-60', className)}
        {...props}
      >
        {label ? <legend className="text-sm font-medium text-slate-900">{label}</legend> : null}
        {description ? (
          <p id={descriptionId} className="m-0 text-xs leading-5 text-slate-500">
            {description}
          </p>
        ) : null}
        <div className="grid gap-2">{children}</div>
        {error ? (
          <p id={errorId} className="m-0 text-xs leading-5 text-red-600">
            {error}
          </p>
        ) : null}
      </fieldset>
    </RadioGroupContext.Provider>
  );
});

/**
 * Props for one labeled radio item.
 */
export type RadioGroupItemProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  description?: ReactNode;
  label: ReactNode;
};

const RadioGroupItem = forwardRef<HTMLInputElement, RadioGroupItemProps>(function RadioGroupItem(
  { className, description, id, label, name, value, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const { error, name: groupName } = useRadioGroupContext('RadioGroup.Item');

  return (
    <label
      htmlFor={inputId}
      className={cn(
        'flex cursor-pointer gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-colors',
        'has-[:checked]:border-slate-950 has-[:checked]:bg-slate-50',
        'has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60',
      )}
    >
      <input
        ref={ref}
        id={inputId}
        name={name ?? groupName}
        type="radio"
        value={value}
        aria-describedby={descriptionId}
        aria-invalid={error ? true : undefined}
        className={cn(
          'mt-0.5 h-4 w-4 border-slate-300 text-slate-950',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2',
          className,
        )}
        {...props}
      />
      <span className="grid gap-1">
        <span className="text-sm font-medium text-slate-900">{label}</span>
        {description ? (
          <span id={descriptionId} className="text-xs leading-5 text-slate-500">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
});

/**
 * Props for the inline layout wrapper used when radio options should wrap in a row.
 */
export type RadioGroupInlineProps = HTMLAttributes<HTMLDivElement>;

const RadioGroupInline = forwardRef<HTMLDivElement, RadioGroupInlineProps>(function RadioGroupInline(
  { className, ...props },
  ref,
) {
  return <div ref={ref} className={cn('flex flex-wrap gap-2', className)} {...props} />;
});

/**
 * Compound radio group component with root, item, and inline layout pieces.
 */
export const RadioGroup = Object.assign(RadioGroupRoot, {
  Root: RadioGroupRoot,
  Item: RadioGroupItem,
  Inline: RadioGroupInline,
});

/**
 * Default export for consumers that prefer default compound-component imports.
 */
export default RadioGroup;
