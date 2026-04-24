import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/lib/ui/cn";

type EmptyStateRootProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

function EmptyStateRoot({
  children,
  className,
  ...props
}: EmptyStateRootProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-20 text-center",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function Icon({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-(--border) bg-(--bg-subtle) text-(--fg-muted)",
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
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-lg font-semibold text-(--fg)", className)} {...props}>
      {children}
    </h3>
  );
}

function Description({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("mt-2 max-w-md text-sm leading-6 text-(--fg-muted)", className)}
      {...props}
    >
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
    <div className={cn("mt-6 flex items-center gap-2", className)} {...props}>
      {children}
    </div>
  );
}

const EmptyState = Object.assign(EmptyStateRoot, {
  Icon,
  Title,
  Description,
  Actions,
});

export default EmptyState;
