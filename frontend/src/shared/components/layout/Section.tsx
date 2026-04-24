import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/lib/ui/cn";

type SectionVariant = "default" | "subtle";

type SectionRootProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  fullBleed?: boolean;
  variant?: SectionVariant;
};

type SectionHeaderProps = HTMLAttributes<HTMLDivElement> & {
  actions?: ReactNode;
  children: ReactNode;
};

type SectionPartProps<T extends HTMLElement> = HTMLAttributes<T> & {
  children: ReactNode;
};

function SectionRoot({
  children,
  className,
  fullBleed = false,
  variant = "default",
  ...props
}: SectionRootProps) {
  const isSubtle = variant === "subtle";

  if (fullBleed) {
    return (
      <section
        className={cn(
          "relative left-1/2 right-1/2 w-screen -translate-x-1/2",
          isSubtle && "bg-(--bg-subtle)",
          className,
        )}
        {...props}
      >
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-6 py-6">
          {children}
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "flex flex-col gap-4",
        isSubtle && "rounded-2xl bg-(--bg-subtle) p-6",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

function SectionHeader({
  actions,
  children,
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between",
        className,
      )}
      {...props}
    >
      <div className="min-w-0 flex-1">{children}</div>

      {actions ? (
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end lg:w-auto lg:flex-none lg:pl-6">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

function SectionTitle({
  children,
  className,
  ...props
}: SectionPartProps<HTMLHeadingElement>) {
  return (
    <h2 className={cn("text-lg font-semibold text-(--fg)", className)} {...props}>
      {children}
    </h2>
  );
}

function SectionDescription({
  children,
  className,
  ...props
}: SectionPartProps<HTMLParagraphElement>) {
  return (
    <p
      className={cn("mt-1 text-sm leading-6 text-(--fg-muted)", className)}
      {...props}
    >
      {children}
    </p>
  );
}

function SectionActions({
  children,
  className,
  ...props
}: SectionPartProps<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-start gap-2 sm:justify-end",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function SectionBody({
  children,
  className,
  ...props
}: SectionPartProps<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-4", className)} {...props}>
      {children}
    </div>
  );
}

const Section = Object.assign(SectionRoot, {
  Root: SectionRoot,
  Header: SectionHeader,
  Title: SectionTitle,
  Description: SectionDescription,
  Actions: SectionActions,
  Body: SectionBody,
});

export default Section;
