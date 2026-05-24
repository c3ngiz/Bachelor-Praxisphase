import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

import { cn } from '../../utils';

/**
 * Semantic visual variants supported by the shared button.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

/**
 * Size options for text and icon-only buttons.
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Props for the shared button component.
 *
 * `loading` disables interaction and exposes `aria-busy`; `iconOnly` switches
 * to square dimensions for toolbar and menu buttons.
 */
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconOnly?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border-slate-950 bg-slate-950 text-white shadow-sm hover:bg-slate-800 focus-visible:ring-slate-950',
  secondary:
    'border-slate-300 bg-white text-slate-900 shadow-sm hover:bg-slate-50 focus-visible:ring-slate-400',
  ghost:
    'border-transparent bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-slate-400',
  destructive:
    'border-red-600 bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-600',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 rounded-md px-3 text-xs',
  md: 'h-10 gap-2 rounded-lg px-4 text-sm',
  lg: 'h-11 gap-2 rounded-lg px-5 text-base',
};

const iconOnlySizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 w-8 rounded-md p-0',
  md: 'h-10 w-10 rounded-lg p-0',
  lg: 'h-11 w-11 rounded-lg p-0',
};

function ButtonSpinner(): JSX.Element {
  return (
    <span
      aria-hidden="true"
      className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}

/**
 * Renders the standard application button with variant, size, and loading states.
 *
 * @param props - Native button props plus design-system button options.
 * @returns A styled button element.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    className,
    disabled,
    iconOnly = false,
    loading = false,
    size = 'md',
    type = 'button',
    variant = 'primary',
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex shrink-0 items-center justify-center border font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        iconOnly ? iconOnlySizeClasses[size] : sizeClasses[size],
        className,
      )}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <ButtonSpinner /> : null}
      {children}
    </button>
  );
});

/**
 * Default export for consumers that prefer default component imports.
 */
export default Button;
