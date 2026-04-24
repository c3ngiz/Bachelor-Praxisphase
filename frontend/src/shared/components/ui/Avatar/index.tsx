import type { HTMLAttributes } from "react";

import { cn } from "@/shared/lib/ui/cn";

type AvatarSize = "sm" | "md" | "lg";
type AvatarShape = "circle" | "rounded";

export type AvatarProps = HTMLAttributes<HTMLDivElement> & {
  alt?: string;
  initials: string;
  src?: string;
  colorClassName?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
};

const sizeClasses: Record<AvatarSize, string> = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-8 w-8 text-[11px]",
  lg: "h-10 w-10 text-sm",
};

const shapeClasses: Record<AvatarShape, string> = {
  circle: "rounded-full",
  rounded: "rounded-xl",
};

export default function Avatar({
  alt,
  className,
  colorClassName = "bg-(--bg-subtle) text-(--fg-muted)",
  initials,
  shape = "circle",
  size = "md",
  src,
  ...props
}: AvatarProps) {
  return (
    <div
      title={alt}
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden font-semibold",
        sizeClasses[size],
        shapeClasses[shape],
        src ? "border border-(--border) bg-(--bg)" : colorClassName,
        className,
      )}
      {...props}
    >
      {src ? (
        <img src={src} alt={alt ?? initials} className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}
