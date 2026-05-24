import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { Button } from '../../../shared/components';

/**
 * Props for an external or SSO-style authentication button.
 */
export interface SocialAuthButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  children: ReactNode;
  icon: ReactNode;
}

/**
 * Renders a secondary full-width auth button with a leading icon.
 *
 * @param props - Button props plus icon and label content.
 * @returns Authentication provider button.
 */
export function SocialAuthButton({ children, icon, ...props }: SocialAuthButtonProps): JSX.Element {
  return (
    <Button type="button" variant="secondary" className="w-full justify-center" {...props}>
      <span aria-hidden="true" className="grid h-5 w-5 place-items-center text-slate-700">
        {icon}
      </span>
      {children}
    </Button>
  );
}
