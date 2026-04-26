import type { CSSProperties, HTMLAttributes } from "react";

import Avatar from "@/shared/components/ui/Avatar";
import { cn } from "@/shared/lib/ui/cn";

export type AvatarStackItem = {
  id: string;
  name: string;
  initials: string;
  colorClassName?: string;
  colorStyle?: CSSProperties;
  src?: string;
};

type Props = HTMLAttributes<HTMLDivElement> & {
  items: AvatarStackItem[];
  max?: number;
  size?: "sm" | "md" | "lg";
  overflowLabel?: (count: number) => string;
};

export default function AvatarStack({
  className,
  items,
  max = items.length,
  overflowLabel = (count) => `+${count}`,
  size = "md",
  ...props
}: Props) {
  const visibleItems = items.slice(0, max);
  const overflow = items.length - visibleItems.length;

  return (
    <div className={cn("flex -space-x-2", className)} {...props}>
      {visibleItems.map((item) => (
        <Avatar
          key={item.id}
          alt={item.name}
          initials={item.initials}
          src={item.src}
          size={size}
          className="border-2 border-white shadow-sm"
          colorClassName={item.colorClassName}
          style={item.colorStyle}
        />
      ))}

      {overflow > 0 ? (
        <Avatar
          alt={`${overflow} more`}
          initials={overflowLabel(overflow)}
          size={size}
          className="border-2 border-(--bg-elevated) bg-slate-200 text-slate-700"
        />
      ) : null}
    </div>
  );
}
