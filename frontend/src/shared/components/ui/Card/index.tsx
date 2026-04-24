import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/lib/ui/cn";

type Variant = "default" | "outline" | "ghost";
type Padding = "none" | "sm" | "md" | "lg";
type Shadow = "none" | "sm" | "md";

type CardRootProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  variant?: Variant;
  padding?: Padding;
  shadow?: Shadow;
  hoverable?: boolean;
  interactive?: boolean;
  selectable?: boolean;
  selected?: boolean;
};

const variantClasses: Record<Variant, string> = {
  default: "border-white/75 bg-(--bg-elevated)",
  outline: "border-(--border) bg-transparent",
  ghost: "border-transparent bg-transparent",
};

const paddingClasses: Record<Padding, string> = {
  none: "",
  sm: "p-2",
  md: "p-4",
  lg: "p-6",
};

const shadowClasses: Record<Shadow, string> = {
  none: "",
  sm: "shadow-sm",
  md: "shadow-md",
};

function CardRoot({
  children,
  className,
  hoverable = true,
  interactive = false,
  padding = "md",
  selectable = false,
  selected = false,
  shadow = "sm",
  variant = "default",
  ...props
}: CardRootProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl border transition-all",
        variantClasses[variant],
        shadowClasses[shadow],
        padding !== "none" && paddingClasses[padding],
        hoverable && "hover:-translate-y-px hover:shadow-md",
        interactive && "cursor-pointer active:scale-[0.99]",
        selectable &&
          selected &&
          "border-(--accent) ring-2 ring-(--accent) ring-offset-2 ring-offset-(--bg)",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

type SectionProps = {
  children: ReactNode;
  className?: string;
  padding?: Padding;
};

const sectionPadding: Record<Padding, string> = {
  none: "",
  sm: "px-3 py-2",
  md: "px-4 py-3",
  lg: "px-6 py-4",
};

function Header({ children, className, padding = "md" }: SectionProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-2",
        sectionPadding[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}

function Content({ children, className, padding = "md" }: SectionProps) {
  return (
    <div
      className={cn("flex flex-col gap-3", sectionPadding[padding], className)}
    >
      {children}
    </div>
  );
}

function Footer({ children, className, padding = "md" }: SectionProps) {
  return (
    <div
      className={cn(
        "border-t border-(--border)/60",
        sectionPadding[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}

function Actions({ children, className }: SectionProps) {
  return (
    <div
      className={cn(
        "absolute right-2 top-2 z-10 flex items-center gap-1",
        "scale-95 opacity-0 transition-all duration-150 ease-out",
        "group-hover:scale-100 group-hover:opacity-100",
        className,
      )}
    >
      {children}
    </div>
  );
}

const Card = Object.assign(CardRoot, {
  Header,
  Content,
  Footer,
  Actions,
});

export default Card;
