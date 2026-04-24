import type { HTMLAttributes } from "react";

import { cn } from "@/shared/lib/ui/cn";

type Props = HTMLAttributes<HTMLDivElement> & {
  label?: string;
  vertical?: boolean;
};

export default function Divider({
  className,
  label,
  vertical = false,
  ...props
}: Props) {
  if (vertical) {
    return (
      <div className={cn("h-full min-h-4 w-px bg-(--border)", className)} aria-hidden="true" {...props} />
    );
  }

  if (!label) {
    return <div className={cn("h-px w-full bg-(--border)", className)} aria-hidden="true" {...props} />;
  }

  return (
    <div className={cn("flex w-full items-center gap-3", className)} role="separator" {...props}>
      <span className="h-px flex-1 bg-(--border)" aria-hidden="true" />
      <span className="text-xs uppercase tracking-wide text-(--fg-muted)">{label}</span>
      <span className="h-px flex-1 bg-(--border)" aria-hidden="true" />
    </div>
  );
}
