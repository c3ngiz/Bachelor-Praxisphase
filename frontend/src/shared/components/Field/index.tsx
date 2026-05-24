import {
  Children,
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useId,
  type HTMLAttributes,
  type LabelHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';

import { cn } from '../../utils';

type FieldContextValue = {
  controlId: string;
  descriptionId: string;
  errorId: string;
  error?: ReactNode;
  required?: boolean;
};

const FieldContext = createContext<FieldContextValue | null>(null);

function useFieldContext(component: string): FieldContextValue {
  const context = useContext(FieldContext);

  if (!context) {
    throw new Error(`${component} must be used within Field.Root`);
  }

  return context;
}

/**
 * Props for the root field provider.
 *
 * The root owns the generated ids and validation state shared by the label,
 * description, error, and control subcomponents.
 */
export type FieldRootProps = HTMLAttributes<HTMLDivElement> & {
  error?: ReactNode;
  id?: string;
  required?: boolean;
};

const FieldRoot = forwardRef<HTMLDivElement, FieldRootProps>(function FieldRoot(
  { children, className, error, id, required, ...props },
  ref,
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <FieldContext.Provider
      value={{
        controlId: fieldId,
        descriptionId: `${fieldId}-description`,
        errorId: `${fieldId}-error`,
        error,
        required,
      }}
    >
      <div ref={ref} className={cn('grid w-full gap-1.5', className)} {...props}>
        {children}
      </div>
    </FieldContext.Provider>
  );
});

/**
 * Props for the field label subcomponent.
 */
export type FieldLabelProps = LabelHTMLAttributes<HTMLLabelElement>;

const FieldLabel = forwardRef<HTMLLabelElement, FieldLabelProps>(function FieldLabel(
  { children, className, ...props },
  ref,
) {
  const { controlId, required } = useFieldContext('Field.Label');

  return (
    <label ref={ref} htmlFor={controlId} className={cn('text-sm font-medium text-slate-900', className)} {...props}>
      {children}
      {required ? <span className="ml-1 text-red-600">*</span> : null}
    </label>
  );
});

/**
 * Props for secondary field help text.
 */
export type FieldDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

const FieldDescription = forwardRef<HTMLParagraphElement, FieldDescriptionProps>(function FieldDescription(
  { className, ...props },
  ref,
) {
  const { descriptionId } = useFieldContext('Field.Description');

  return <p ref={ref} id={descriptionId} className={cn('m-0 text-xs leading-5 text-slate-500', className)} {...props} />;
});

/**
 * Props for field validation text.
 */
export type FieldErrorProps = HTMLAttributes<HTMLParagraphElement>;

const FieldError = forwardRef<HTMLParagraphElement, FieldErrorProps>(function FieldError(
  { children, className, ...props },
  ref,
) {
  const { error, errorId } = useFieldContext('Field.Error');
  const content = children ?? error;

  if (!content) {
    return null;
  }

  return <p ref={ref} id={errorId} className={cn('m-0 text-xs leading-5 text-red-600', className)} {...props}>{content}</p>;
});

type ControlElementProps = {
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  id?: string;
  required?: boolean;
};

/**
 * Props for the field control slot.
 *
 * The child control receives the generated id, required state, and
 * `aria-describedby` references for description and error text.
 */
export type FieldControlProps = {
  children: ReactElement<ControlElementProps>;
};

function FieldControl({ children }: FieldControlProps): ReactElement<ControlElementProps> {
  const { controlId, descriptionId, error, errorId, required } = useFieldContext('Field.Control');

  if (!isValidElement(children) || Children.count(children) !== 1) {
    throw new Error('Field.Control expects a single valid React element child.');
  }

  const describedBy = [children.props['aria-describedby'], descriptionId, error ? errorId : null]
    .filter(Boolean)
    .join(' ');

  return cloneElement(children, {
    'aria-describedby': describedBy || undefined,
    'aria-invalid': error ? true : children.props['aria-invalid'],
    id: children.props.id ?? controlId,
    required: children.props.required ?? required,
  });
}

/**
 * Compound field component used by form controls to share accessible metadata.
 */
export const Field = Object.assign(FieldRoot, {
  Root: FieldRoot,
  Label: FieldLabel,
  Description: FieldDescription,
  Error: FieldError,
  Control: FieldControl,
});

/**
 * Default export for consumers that prefer default compound-component imports.
 */
export default Field;
