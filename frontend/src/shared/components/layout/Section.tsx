import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export default function Section({ children, className = "" }: Props) {
  return (
    <section
      className={[
        "flex flex-col gap-4",
        className,
      ].join(" ")}
    >
      {children}
    </section>
  );
}