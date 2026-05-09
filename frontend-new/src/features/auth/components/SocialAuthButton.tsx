import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { Button } from '../../../shared/components';

export interface SocialAuthButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  children: ReactNode;
  mark: string;
}

export function SocialAuthButton({ children, mark, ...props }: SocialAuthButtonProps): JSX.Element {
  return (
    <Button type="button" variant="secondary" className="w-full justify-center" {...props}>
      <span
        aria-hidden="true"
        className="grid h-5 w-5 place-items-center rounded-full bg-slate-950 text-[11px] font-semibold text-white"
      >
        {mark}
      </span>
      {children}
    </Button>
  );
}
