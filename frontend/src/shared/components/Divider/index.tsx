import { forwardRef, type HTMLAttributes } from 'react';

import { cn } from '../../utils';

/**
 * Props for the visual divider.
 */
export type DividerProps = HTMLAttributes<HTMLHRElement> & {
  orientation?: 'horizontal' | 'vertical';
};

/**
 * Renders a horizontal or vertical separator line.
 *
 * @param props - Native `hr` props plus the visual orientation.
 * @returns Separator element.
 */
export const Divider = forwardRef<HTMLHRElement, DividerProps>(function Divider(
  { className, orientation = 'horizontal', ...props },
  ref,
) {
  return (
    <hr
      ref={ref}
      aria-orientation={orientation}
      className={cn(
        'shrink-0 border-0 bg-slate-200',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full min-h-6 w-px',
        className,
      )}
      {...props}
    />
  );
});

/**
 * Default export for consumers that prefer default component imports.
 */
export default Divider;
