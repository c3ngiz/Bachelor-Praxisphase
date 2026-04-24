import type { InputHTMLAttributes } from "react";

import Field from "@/shared/components/ui/Field";
import { cn } from "@/shared/lib/ui/cn";

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
  description?: string;
  error?: string;
};

export default function Checkbox({
  className,
  description,
  error,
  id,
  label,
  ...props
}: CheckboxProps) {
  const fieldId = id ?? props.name;

  return (
    <Field.Root id={fieldId} error={error}>
      <label htmlFor={fieldId} className="inline-flex items-start gap-2 text-sm text-(--fg)">
        <Field.Control>
          <input
            type="checkbox"
            className={cn(
              "mt-0.5 h-4 w-4 rounded border-(--border) bg-(--bg-elevated) text-(--accent)",
              "focus:ring-2 focus:ring-(--accent) focus:ring-offset-0 focus:outline-none",
              className,
            )}
            {...props}
          />
        </Field.Control>

        <span className="space-y-1">
          {label ? <span className="block">{label}</span> : null}
          {description ? (
            <Field.Description className="text-left">{description}</Field.Description>
          ) : null}
        </span>
      </label>

      <Field.Error />
    </Field.Root>
  );
}
