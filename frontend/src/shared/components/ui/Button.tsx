import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--accent)] text-[var(--accent-contrast)] border-[var(--accent)] hover:bg-[var(--accent-hover)]",

  secondary:
    "bg-[var(--bg-elevated)] text-[var(--fg)] border-[var(--border)] hover:border-[var(--accent)]",

  ghost:
    "bg-transparent text-[var(--fg)] border-transparent hover:border-[var(--border)]",

  danger:
    "bg-red-600 text-white border-red-600 hover:bg-red-700",
};

export default function Button({
  children,
  className = "",
  variant = "primary",
  type = "button",
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={[
        "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium border transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}