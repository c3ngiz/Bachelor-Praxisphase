import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useId,
  type HTMLAttributes,
  type LabelHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";

import { cn } from "@/shared/lib/ui/cn";

type FieldContextValue = {
  controlId: string;
  descriptionId: string;
  errorId: string;
  error?: string;
  required?: boolean;
};

const FieldContext = createContext<FieldContextValue | null>(null);

function useFieldContext(part: string): FieldContextValue {
  const context = useContext(FieldContext);

  if (!context) {
    throw new Error(`${part} must be used within Field.Root`);
  }

  return context;
}

type FieldRootProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  error?: string;
  required?: boolean;
  id?: string;
};

function FieldRoot({
  children,
  className,
  error,
  required,
  id,
  ...props
}: FieldRootProps) {
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
      <div className={cn("w-full space-y-1.5", className)} {...props}>
        {children}
      </div>
    </FieldContext.Provider>
  );
}

type FieldLabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  children: ReactNode;
};

function FieldLabel({ children, className, ...props }: FieldLabelProps) {
  const { controlId, required } = useFieldContext("Field.Label");

  return (
    <label
      htmlFor={controlId}
      className={cn("block text-sm font-medium text-(--fg)", className)}
      {...props}
    >
      {children}
      {required ? <span className="ml-1 text-(--fg-muted)">*</span> : null}
    </label>
  );
}

type FieldDescriptionProps = HTMLAttributes<HTMLParagraphElement> & {
  children: ReactNode;
};

function FieldDescription({
  children,
  className,
  ...props
}: FieldDescriptionProps) {
  const { descriptionId } = useFieldContext("Field.Description");

  return (
    <p
      id={descriptionId}
      className={cn("text-xs leading-5 text-(--fg-muted)", className)}
      {...props}
    >
      {children}
    </p>
  );
}

type FieldErrorProps = HTMLAttributes<HTMLParagraphElement> & {
  children?: ReactNode;
};

function FieldError({ children, className, ...props }: FieldErrorProps) {
  const { error, errorId } = useFieldContext("Field.Error");
  const content = children ?? error;

  if (!content) {
    return null;
  }

  return (
    <p
      id={errorId}
      className={cn("text-xs text-red-500", className)}
      {...props}
    >
      {content}
    </p>
  );
}

type ControlElementProps = {
  id?: string;
  className?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

type FieldControlProps = {
  children: ReactElement<ControlElementProps>;
  className?: string;
};

function FieldControl({ children, className }: FieldControlProps) {
  const { controlId, descriptionId, errorId, error } = useFieldContext(
    "Field.Control",
  );

  if (!isValidElement(children) || Children.count(children) !== 1) {
    throw new Error("Field.Control expects a single valid React element child");
  }

  const describedBy = [
    children.props["aria-describedby"],
    descriptionId,
    error ? errorId : null,
  ]
    .filter(Boolean)
    .join(" ");

  return cloneElement(children, {
    id: children.props.id ?? controlId,
    className: cn(children.props.className, className),
    "aria-describedby": describedBy || undefined,
    "aria-invalid": error ? true : children.props["aria-invalid"],
  });
}

const Field = Object.assign(FieldRoot, {
  Root: FieldRoot,
  Label: FieldLabel,
  Description: FieldDescription,
  Error: FieldError,
  Control: FieldControl,
});

export default Field;
