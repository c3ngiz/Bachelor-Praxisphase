import type { InputHTMLAttributes, ReactNode } from "react";

import Field from "@/shared/components/ui/Field";
import { cn } from "@/shared/lib/ui/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  description?: string;
  error?: string;
  endAdornment?: ReactNode;
  startAdornment?: ReactNode;
};

export default function Input({
  className,
  description,
  endAdornment,
  error,
  id,
  label,
  startAdornment,
  ...props
}: InputProps) {
  const fieldId = id ?? props.name;

  return (
    <Field.Root id={fieldId} error={error}>
      {label ? <Field.Label>{label}</Field.Label> : null}

      <div className="relative">
        {startAdornment ? (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-(--fg-muted)">
            {startAdornment}
          </span>
        ) : null}

        <Field.Control>
          <input
            className={cn(
              "w-full rounded-lg border border-(--border) bg-(--bg-elevated) px-3 py-2 text-sm text-(--fg)",
              "placeholder:text-(--fg-muted) focus:border-(--accent) focus:outline-none",
              startAdornment && "pl-10",
              endAdornment && "pr-10",
              className,
            )}
            {...props}
          />
        </Field.Control>

        {endAdornment ? (
          <span className="absolute inset-y-0 right-3 flex items-center text-(--fg-muted)">
            {endAdornment}
          </span>
        ) : null}
      </div>

      {description ? <Field.Description>{description}</Field.Description> : null}
      <Field.Error />
    </Field.Root>
  );
}
