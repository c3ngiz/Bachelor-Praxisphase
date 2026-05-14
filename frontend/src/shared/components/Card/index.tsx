import { forwardRef, type HTMLAttributes } from 'react';

import { cn } from '../../utils';

export type CardRootProps = HTMLAttributes<HTMLDivElement> & {
  hoverable?: boolean;
  selected?: boolean;
};

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

export const Card = Object.assign(CardRoot, {
  Root: CardRoot,
  Header: CardHeader,
  Content: CardContent,
  Footer: CardFooter,
});

export default Card;
