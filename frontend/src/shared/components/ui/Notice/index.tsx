import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/lib/ui/cn";

type NoticeVariant = "default" | "info" | "danger";

type NoticeRootProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  variant?: NoticeVariant;
};

const variantClasses: Record<NoticeVariant, string> = {
  default: "border-(--border) bg-(--bg) text-(--fg-muted)",
  info: "border-sky-200 bg-sky-50 text-sky-700",
  danger: "border-red-200 bg-red-50 text-red-700",
};

function NoticeRoot({
  children,
  className,
  variant = "default",
  ...props
}: NoticeRootProps) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 text-sm",
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function Title({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("font-medium text-(--fg)", className)} {...props}>
      {children}
    </p>
  );
}

function Description({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("leading-6", className)} {...props}>
      {children}
    </p>
  );
}

function Actions({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mt-3 flex items-center gap-2", className)} {...props}>
      {children}
    </div>
  );
}

const Notice = Object.assign(NoticeRoot, {
  Title,
  Description,
  Actions,
});

export default Notice;
