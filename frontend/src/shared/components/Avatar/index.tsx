import { forwardRef, type HTMLAttributes } from 'react';

import { cn } from '../../utils';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';
export type AvatarShape = 'circle' | 'rounded';

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

export default Avatar;
