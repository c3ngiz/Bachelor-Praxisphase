import type { HTMLAttributes } from "react";

import { cn } from "@/shared/lib/ui/cn";

type SkeletonProps = HTMLAttributes<HTMLDivElement>;

function SkeletonRoot({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded bg-(--border)", className)}
      {...props}
    />
  );
}

function Text({ className, ...props }: SkeletonProps) {
  return <SkeletonRoot className={cn("h-4 w-full", className)} {...props} />;
}

function Block({ className, ...props }: SkeletonProps) {
  return <SkeletonRoot className={cn("h-8 w-full", className)} {...props} />;
}

function Circle({ className, ...props }: SkeletonProps) {
  return <SkeletonRoot className={cn("h-8 w-8 rounded-full", className)} {...props} />;
}

const Skeleton = Object.assign(SkeletonRoot, {
  Text,
  Block,
  Circle,
});

export default Skeleton;
