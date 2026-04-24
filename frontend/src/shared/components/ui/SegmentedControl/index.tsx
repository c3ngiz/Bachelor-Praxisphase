import type { ReactNode } from "react";

import { cn } from "@/shared/lib/ui/cn";

export type SegmentedControlOption<T extends string> = {
  value: T;
  label: string;
  icon?: ReactNode;
};

type Props<T extends string> = {
  value: T;
  options: SegmentedControlOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
};

export default function SegmentedControl<T extends string>({
  ariaLabel,
  className,
  onChange,
  options,
  value,
}: Props<T>) {
  return (
    <div
      aria-label={ariaLabel}
      className={cn(
        "inline-flex h-10 items-center rounded-xl border border-(--border) bg-(--bg-elevated) p-1",
        className,
      )}
      role="group"
    >
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-[background-color,color,box-shadow]",
              isActive
                ? "bg-(--accent) text-white shadow-[0_8px_18px_rgba(73,67,190,0.24)]"
                : "text-(--fg-muted) hover:bg-(--bg-subtle) hover:text-(--fg)",
            )}
          >
            {option.icon}
            <span className="sr-only sm:not-sr-only">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
