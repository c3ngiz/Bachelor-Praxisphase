import type { ReactNode } from "react";

type Props = {
  title?: string;
  children: ReactNode;
};

export default function PageContainer({ title, children }: Props) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-6">
      {title ? <h1 className="mb-6 text-2xl font-bold text-(--fg)">{title}</h1> : null}
      <div className="space-y-6">{children}</div>
    </section>
  );
}