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
  const hasCenter = Boolean(center);
  const hasRight = Boolean(resolvedRight);

  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-(--fg)">{title}</h2>

          {description ? (
            <p className="mt-1 text-sm leading-6 text-(--fg-muted)">
              {description}
            </p>
          ) : null}
        </div>

        {(hasCenter || hasRight) ? (
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end lg:w-auto lg:flex-none lg:pl-6">
            {hasCenter ? (
              <div className="min-w-0 flex-1 lg:flex-none">
                {center}
              </div>
            ) : null}

            {hasRight ? (
              <div className="flex items-center justify-start gap-2 sm:justify-end">
                {resolvedRight}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}