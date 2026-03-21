import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

export default function SectionHeader({
  title,
  description,
  actions,
}: Props) {
  return (
    <div className="flex items-center justify-between gap-4">

      {/* LEFT */}
      <div className="flex flex-col">
        <h2 className="text-lg font-semibold text-(--fg)">
          {title}
        </h2>

        {description && (
          <p className="text-sm text-(--fg-muted)">
            {description}
          </p>
        )}
      </div>

      {/* RIGHT */}
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}