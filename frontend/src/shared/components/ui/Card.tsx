import type { ReactNode, HTMLAttributes } from "react";

type Variant = "default" | "outline" | "ghost";
type Padding = "none" | "sm" | "md" | "lg";
type Shadow = "none" | "sm" | "md";

type CardRootProps = {
  children: ReactNode;
  className?: string;

  variant?: Variant;
  padding?: Padding;
  shadow?: Shadow;

  hoverable?: boolean;
  interactive?: boolean;

  selectable?: boolean;
  selected?: boolean;
} & HTMLAttributes<HTMLDivElement>;

function CardRoot({
  children,
  className = "",

  variant = "default",
  padding = "md",
  shadow = "sm",

  hoverable = true,
  interactive = false,

  selectable = false,
  selected = false,

  ...props
}: CardRootProps) {
  const variantClasses = {
    default: "bg-(--bg-elevated) border-(--border)",
    outline: "bg-transparent border-(--border)",
    ghost: "bg-transparent border-transparent",
  }[variant];

  const paddingClasses = {
    none: "",
    sm: "p-2",
    md: "p-4",
    lg: "p-6",
  }[padding];

  const shadowClasses = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
  }[shadow];

  return (
    <div
      {...props}
      className={[
        "group relative flex flex-col rounded-xl border transition-all",
        variantClasses,
        shadowClasses,

        // fallback padding for cards that do not use sections
        padding === "none" ? "" : paddingClasses,

        hoverable ? "hover:shadow-md hover:-translate-y-px" : "",
        interactive ? "cursor-pointer active:scale-[0.99]" : "",

        selectable
          ? selected
            ? "border-(--accent) ring-2 ring-(--accent)"
            : ""
          : "",

        className,
      ].join(" ")}
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

function Header({ children, className = "", padding = "md" }: SectionProps) {
  return (
    <div
      className={[
        "flex items-start justify-between gap-2",
        sectionPadding[padding],
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function Content({ children, className = "", padding = "md" }: SectionProps) {
  return (
    <div
      className={[
        "flex flex-col gap-3",
        sectionPadding[padding],
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function Footer({ children, className = "", padding = "md" }: SectionProps) {
  return (
    <div
      className={[
        "border-t border-(--border)/60",
        sectionPadding[padding],
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function Actions({ children, className = "" }: SectionProps) {
  return (
    <div
      className={[
        "absolute right-2 top-2 z-10 flex items-center gap-1",

        // hidden by default
        "opacity-0 scale-95",

        // show on hover
        "group-hover:opacity-100 group-hover:scale-100",

        // animation
        "transition-all duration-150 ease-out",

        className,
      ].join(" ")}
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