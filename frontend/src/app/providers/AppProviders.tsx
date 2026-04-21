import type { ReactNode } from "react";

import { AuthProvider } from "@/features/auth/context/AuthProvider";

type Props = {
  children: ReactNode;
};

export function AppProviders({ children }: Props) {
  return <AuthProvider>{children}</AuthProvider>;
}
