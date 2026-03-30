import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  center?: ReactNode;
  right?: ReactNode;
  actions?: ReactNode;
};

export default function SectionHeader({
  title,
  description,
  center,
  right,
  actions,
}: Props) {
  const resolvedRight = right ?? actions;

  return (
    <div className="grid grid-cols-[minmax(220px,1fr)_minmax(380px,2fr)_auto] items-start gap-8">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-(--fg)">{title}</h2>

        {description && (
          <p className="mt-1 text-sm leading-6 text-(--fg-muted)">
            {description}
          </p>
        )}
      </div>

      <div className="flex w-full justify-center">
        {center}
      </div>

      <div className="flex min-h-12 items-center justify-end gap-2">
        {resolvedRight}
      </div>
    </div>
  );
}