import { useEffect } from 'react';

import { DEFAULT_ROUTE } from '../../../shared/constants';

/** Dashboard landing page for authenticated users. */
export function DashboardPage(): JSX.Element {
  useEffect(() => {
    window.location.replace(DEFAULT_ROUTE);
  }, []);

  return (
    <section>
      <h1>Redirecting to workspace...</h1>
    </section>
  );
}
