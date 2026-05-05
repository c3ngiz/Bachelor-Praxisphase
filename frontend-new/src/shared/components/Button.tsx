import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../utils';

/** Props for the reusable button component. */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visible button content. */
  children: ReactNode;
  /** Visual style variant for the button. */
  variant?: 'primary' | 'secondary';
}

/** Reusable application button with minimal styling hooks. */
export function Button({ children, className, variant = 'primary', ...props }: ButtonProps): JSX.Element {
  return (
    <button className={cn('button', `button--${variant}`, className)} type="button" {...props}>
      {children}
    </button>
  );
}
