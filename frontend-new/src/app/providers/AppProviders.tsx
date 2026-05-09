import type { ReactNode } from 'react';
import { AuthProvider } from '../../features/auth';

/** Props for the application provider composition component. */
export interface AppProvidersProps {
  /** React tree that should receive application-level providers. */
  children: ReactNode;
}

/** Composes global providers for the application. */
export function AppProviders({ children }: AppProvidersProps): JSX.Element {
  return <AuthProvider>{children}</AuthProvider>;
}
