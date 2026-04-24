import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/lib/ui/cn";

type BadgeVariant =
  | "default"
  | "subtle"
  | "success"
  | "info"
  | "warning"
  | "danger";

type BadgeSize = "sm" | "md";

type Props = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
};

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-(--bg) text-(--fg)",
  subtle: "bg-(--bg-subtle) text-(--fg-muted)",
  success: "bg-violet-100 text-violet-700",
  info: "bg-indigo-100 text-indigo-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "rounded-md px-2 py-1 text-[11px]",
  md: "rounded-lg px-2.5 py-1 text-xs",
};

export default function Badge({
  children,
  className,
  size = "sm",
  variant = "default",
  ...props
}: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-semibold",
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
