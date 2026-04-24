import type { ReactNode, SelectHTMLAttributes } from "react";

import Field from "@/shared/components/ui/Field";
import { cn } from "@/shared/lib/ui/cn";

type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  description?: string;
  error?: string;
  options?: SelectOption[];
  placeholder?: string;
  startAdornment?: ReactNode;
};

export default function Select({
  children,
  className,
  description,
  error,
  id,
  label,
  options,
  placeholder,
  startAdornment,
  ...props
}: SelectProps) {
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
          <select
            className={cn(
              "w-full appearance-none rounded-lg border border-(--border) bg-(--bg-elevated) px-3 py-2 pr-9 text-sm text-(--fg)",
              "focus:border-(--accent) focus:outline-none disabled:cursor-not-allowed disabled:opacity-60",
              startAdornment && "pl-10",
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

        <span
          className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-(--fg-muted)"
          aria-hidden="true"
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </div>

      {description ? <Field.Description>{description}</Field.Description> : null}
      <Field.Error />
    </Field.Root>
  );
}
