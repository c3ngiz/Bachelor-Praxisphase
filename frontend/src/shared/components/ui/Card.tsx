import type { ReactNode, HTMLAttributes } from "react";

type CardRootProps = {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  selectable?: boolean;
  selected?: boolean;
} & HTMLAttributes<HTMLDivElement>;

function CardRoot({
  children,
  className = "",
  hoverable = true,
  selectable = false,
  selected = false,
  ...props
}: CardRootProps) {
  return (
    <div
      {...props}
      className={[
        "flex flex-col rounded-xl border bg-(--bg-elevated) shadow-sm transition-all",

        // spacing handled by sections instead of root
        "overflow-hidden",

        hoverable ? "hover:shadow-md hover:-translate-y-px" : "",

        selectable
          ? selected
            ? "border-(--accent) ring-2 ring-(--accent)"
            : "border-(--border)"
          : "border-(--border)",

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
};

function Header({ children, className = "" }: SectionProps) {
  return (
    <div
      className={[
        "flex items-start justify-between gap-2 px-4 pt-4",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function Content({ children, className = "" }: SectionProps) {
  return (
    <div
      className={[
        "flex flex-col gap-3 px-4 py-2",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function Footer({ children, className = "" }: SectionProps) {
  return (
    <div
      className={[
        "px-4 pb-4 pt-2",
        "border-t border-(--border)/60",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

// attach subcomponents
const Card = Object.assign(CardRoot, {
  Header,
  Content,
  Footer,
});

export default Card;