import { AuthLayout, AppLayout } from '../../shared/layouts';
import { appRoutes } from './routes';

/** Maps the current browser path to the configured application route. */
export function AppRouter(): JSX.Element {
  const pathname = window.location.pathname;
  const route = appRoutes.find((item) => item.path === pathname) ?? appRoutes[1];
  const Page = route.Component;

  if (route.path === '/login') {
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
