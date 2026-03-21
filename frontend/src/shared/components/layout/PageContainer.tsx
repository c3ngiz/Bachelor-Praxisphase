import type { ReactNode } from "react";

type Props = {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export default function PageContainer({ title, actions, children }: Props) {
  return (
    <section className="mx-auto w-full px-6 py-6">

      {(title || actions) && (
        <div className="mb-6 flex items-center justify-between">
          {title ? (
            <h1 className="text-2xl font-semibold text-(--fg)">
              {title}
            </h1>
          ) : <div />}

          {actions}
        </div>
      )}

      <div className="space-y-6">{children}</div>
    </section>
  );
}