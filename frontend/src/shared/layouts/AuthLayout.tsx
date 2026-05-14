import type { ReactNode } from 'react';

/** Props for the authentication layout. */
export interface AuthLayoutProps {
  /** Authentication page content. */
  children: ReactNode;
}

/** Centers authentication pages in a focused layout. */
export function AuthLayout({ children }: AuthLayoutProps): JSX.Element {
  return <main className="auth-shell">{children}</main>;
}
