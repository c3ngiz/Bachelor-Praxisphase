import type { TextareaHTMLAttributes } from "react";

import Field from "@/shared/components/ui/Field";
import { cn } from "@/shared/lib/ui/cn";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  description?: string;
  error?: string;
};

export default function Textarea({
  className,
  description,
  error,
  id,
  label,
  ...props
}: TextareaProps) {
  const fieldId = id ?? props.name;

  return (
    <Field.Root id={fieldId} error={error}>
      {label ? <Field.Label>{label}</Field.Label> : null}

      <Field.Control>
        <textarea
          className={cn(
            "min-h-24 w-full resize-y rounded-lg border border-(--border) bg-(--bg-elevated) px-3 py-2 text-sm text-(--fg)",
            "placeholder:text-(--fg-muted) focus:border-(--accent) focus:outline-none",
            className,
          )}
          {...props}
        />
      </Field.Control>

      {description ? <Field.Description>{description}</Field.Description> : null}
      <Field.Error />
    </Field.Root>
  );
}
