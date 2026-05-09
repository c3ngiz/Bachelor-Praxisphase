import { AuthLayout, AppLayout } from '../../shared/layouts';
import { appRoutes } from './routes';

/** Maps the current browser path to the configured application route. */
export function AppRouter(): JSX.Element {
  const pathname = window.location.pathname;
  const fallbackRoute = appRoutes.find((item) => item.path === '/dashboard') ?? appRoutes[0];
  const route = appRoutes.find((item) => item.path === pathname) ?? fallbackRoute;
  const Page = route.Component;

  if (route.path === '/sign-in' || route.path === '/sign-up') {
    return (
      <AuthLayout>
        <Page />
      </AuthLayout>
    );
  }

  return (
    <AppLayout routes={appRoutes}>
      <Page />
    </AppLayout>
  );
}
