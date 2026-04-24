import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/shared/lib/ui/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconOnly?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)]",
  secondary:
    "border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--fg)] hover:border-[var(--accent)]",
  ghost:
    "border-transparent bg-transparent text-[var(--fg)] hover:border-[var(--border)] hover:bg-[var(--bg)]",
  danger: "border-red-600 bg-red-600 text-white hover:bg-red-700",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-8 gap-1.5 rounded-md px-3 py-1.5 text-xs",
  md: "min-h-10 gap-2 rounded-lg px-4 py-2 text-sm",
  lg: "min-h-11 gap-2 rounded-xl px-5 py-2.5 text-sm",
};

const iconOnlySizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 w-8 rounded-md p-0",
  md: "h-10 w-10 rounded-lg p-0",
  lg: "h-11 w-11 rounded-xl p-0",
};

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    className,
    disabled,
    iconOnly = false,
    loading = false,
    size = "md",
    type = "button",
    variant = "primary",
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center border font-medium transition-[background-color,border-color,color,box-shadow,transform]",
        "focus:outline-none focus:ring-2 focus:ring-(--focus-ring)",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        iconOnly ? iconOnlySizeClasses[size] : sizeClasses[size],
        className,
      )}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
});

export default Button;
