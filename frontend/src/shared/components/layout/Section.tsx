import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  variant?: "default" | "subtle";
  fullBleed?: boolean;
};

export default function Section({
  children,
  className = "",
  variant = "default",
  fullBleed = false,
}: Props) {
  const isSubtle = variant === "subtle";

  if (fullBleed) {
    return (
      <section
        className={[
          "relative left-1/2 right-1/2 w-screen -translate-x-1/2",
          isSubtle ? "bg-[var(--bg-subtle)]" : "",
          className,
        ].join(" ")}
      >
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-6 py-6">
          {children}
        </div>
      </section>
    );
  }

  return (
    <section
      className={[
        "flex flex-col gap-4",
        isSubtle ? "rounded-2xl bg-[var(--bg-subtle)] p-6" : "",
        className,
      ].join(" ")}
    >
      {children}
    </section>
  );
}