import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/lib/ui/cn";

type GridRootProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  minItemWidth?: string;
};

export default function Grid({
  children,
  className,
  minItemWidth = "230px",
  style,
  ...props
}: GridRootProps) {
  return (
    <div
      className={cn("grid items-start gap-x-5 gap-y-7", className)}
      style={{
        gridTemplateColumns: `repeat(auto-fill,minmax(${minItemWidth},1fr))`,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
