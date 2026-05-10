import { useEffect } from 'react';

import { useAuth } from '../../features/auth';
import { AuthLayout, AppLayout } from '../../shared/layouts';
import { DEFAULT_ROUTE } from '../../shared/constants';
import { appRoutes, type AppRoute, type AppRouteContext } from './routes';

interface MatchedRoute {
  /** Route configuration selected for the current pathname. */
  route: AppRoute;
  /** Dynamic route context passed to the rendered component. */
  context: AppRouteContext;
}

/** Maps the current browser path to the configured application route. */
export function AppRouter(): JSX.Element {
  const { isAuthenticated, isInitialized } = useAuth();
  const pathname = window.location.pathname;
  const fallbackRoute = appRoutes.find((item) => item.path === DEFAULT_ROUTE) ?? appRoutes[0];
  const matchedRoute = findMatchedRoute(pathname) ?? {
    context: { params: {}, pathname },
    route: fallbackRoute,
  };
  const { context, route } = matchedRoute;
  const Page = route.Component;
  const isAuthRoute = route.path === '/sign-in' || route.path === '/sign-up';

  if (route.redirectTo) {
    return <RedirectTo path={route.redirectTo} />;
  }

  if (isAuthRoute) {
    if (isInitialized && isAuthenticated) {
      return <RedirectTo path={DEFAULT_ROUTE} />;
    }

    return (
      <AuthLayout>
        <Page {...context} />
      </AuthLayout>
    );
  }

  if (route.requiresAuth && !isInitialized) {
    return <RouteLoadingState />;
  }

  if (route.requiresAuth && !isAuthenticated) {
    return <RedirectTo path="/sign-in" />;
  }

  return (
    <AppLayout routes={appRoutes}>
      <Page {...context} />
    </AppLayout>
  );
}

/**
 * Finds the first static or dynamic route matching a pathname.
 *
 * @param pathname - Browser pathname.
 * @returns Matched route with route params, or null when no route matches.
 */
function findMatchedRoute(pathname: string): MatchedRoute | null {
  for (const route of appRoutes) {
    const params = matchPath(route.path, pathname);

    if (params) {
      return {
        context: { params, pathname },
        route,
      };
    }
  }

  return null;
}

/**
 * Matches a path pattern with `:param` segments against a pathname.
 *
 * @param pattern - Configured route path pattern.
 * @param pathname - Browser pathname.
 * @returns Parsed route params, or null when the pattern does not match.
 */
function matchPath(pattern: string, pathname: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathnameParts = pathname.split('/').filter(Boolean);

  if (patternParts.length !== pathnameParts.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let index = 0; index < patternParts.length; index += 1) {
    const patternPart = patternParts[index];
    const pathnamePart = pathnameParts[index];

    if (patternPart.startsWith(':')) {
      params[patternPart.slice(1)] = decodeURIComponent(pathnamePart);
      continue;
    }

    if (patternPart !== pathnamePart) {
      return null;
    }
  }

  return params;
}

interface RedirectToProps {
  /** Destination path. */
  path: string;
}

/** Redirects the browser to another in-app path. */
function RedirectTo({ path }: RedirectToProps): JSX.Element {
  useEffect(() => {
    if (window.location.pathname !== path) {
      window.location.replace(path);
    }
  }, [path]);

  return <RouteLoadingState />;
}

/** Renders a minimal app-level loading state during route decisions. */
function RouteLoadingState(): JSX.Element {
  return (
    <main className="auth-shell">
      <p className="m-0 text-sm text-slate-600">Loading...</p>
    </main>
  );
}
