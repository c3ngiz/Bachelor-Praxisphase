import { forwardRef, type HTMLAttributes } from 'react';

import { cn } from '../../utils';

/**
 * Props for the root card container.
 *
 * `hoverable` and `selected` provide list-item affordances without changing
 * the semantic element type.
 */
export type CardRootProps = HTMLAttributes<HTMLDivElement> & {
  hoverable?: boolean;
  selected?: boolean;
};

/**
 * Props shared by card header, content, and footer sections.
 */
export type CardSectionProps = HTMLAttributes<HTMLDivElement>;

const CardRoot = forwardRef<HTMLDivElement, CardRootProps>(function CardRoot(
  { className, hoverable = false, selected = false, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'relative rounded-lg border border-slate-200 bg-white shadow-sm',
        hoverable && 'z-10 transition-shadow hover:border-slate-300 hover:shadow-md',
        selected && 'border-slate-950 ring-2 ring-slate-950/10',
        className,
      )}
      {...props}
    />
  );
});

const CardHeader = forwardRef<HTMLDivElement, CardSectionProps>(function CardHeader(
  { className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn('flex items-start justify-between gap-4 border-b border-slate-200 p-4', className)}
      {...props}
    />
  );
});

const CardContent = forwardRef<HTMLDivElement, CardSectionProps>(function CardContent(
  { className, ...props },
  ref,
) {
  return <div ref={ref} className={cn('p-4', className)} {...props} />;
});

const CardFooter = forwardRef<HTMLDivElement, CardSectionProps>(function CardFooter(
  { className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn('flex items-center justify-end gap-2 border-t border-slate-200 p-4', className)}
      {...props}
    />
  );
});

/**
 * Compound card component with root, header, content, and footer sections.
 */
export const Card = Object.assign(CardRoot, {
  Root: CardRoot,
  Header: CardHeader,
  Content: CardContent,
  Footer: CardFooter,
});

/**
 * Default export for consumers that prefer default compound-component imports.
 */
export default Card;
