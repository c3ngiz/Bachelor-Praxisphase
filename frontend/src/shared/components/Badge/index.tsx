import { forwardRef, type HTMLAttributes } from 'react';

import { cn } from '../../utils';

/**
 * Status color variants supported by compact badge labels.
 */
export type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive';

/**
 * Props for the shared badge component.
 */
export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variantClasses: Record<BadgeVariant, string> = {
  default: 'border-slate-200 bg-slate-100 text-slate-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  destructive: 'border-red-200 bg-red-50 text-red-700',
};

/**
 * Renders a compact status or metadata badge.
 *
 * @param props - Native span props plus an optional status variant.
 * @returns A styled inline badge.
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { className, variant = 'default', ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
});

/**
 * Default export for consumers that prefer default component imports.
 */
export default Badge;
