import { forwardRef, type HTMLAttributes } from 'react';

import { cn } from '../../utils';

/**
 * Supported avatar dimensions used by profile, workspace, and editor identity UI.
 */
export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Visual avatar shape variants.
 */
export type AvatarShape = 'circle' | 'rounded';

/**
 * Props for the shared avatar component.
 *
 * The component renders an image when `src` is provided and falls back to
 * initials or another short label when the user has no avatar image.
 */
export type AvatarProps = HTMLAttributes<HTMLDivElement> & {
  alt?: string;
  fallback: string;
  src?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
};

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-11 w-11 text-sm',
  xl: 'h-14 w-14 text-base',
};

const shapeClasses: Record<AvatarShape, string> = {
  circle: 'rounded-full',
  rounded: 'rounded-lg',
};

/**
 * Renders a deterministic user avatar shell with optional image content.
 *
 * @param props - Avatar props including fallback text, image source, size, and shape.
 * @returns Avatar element suitable for user summaries and collaborator lists.
 */
export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(function Avatar(
  { alt, className, fallback, shape = 'circle', size = 'md', src, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      title={alt}
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden bg-slate-100 font-semibold text-slate-700 ring-1 ring-slate-200',
        sizeClasses[size],
        shapeClasses[shape],
        className,
      )}
      {...props}
    >
      {src ? <img src={src} alt={alt ?? fallback} className="h-full w-full object-cover" /> : fallback}
    </div>
  );
});

/**
 * Default export for consumers that prefer default component imports.
 */
export default Avatar;
