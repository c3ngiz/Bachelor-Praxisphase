import { DashboardSummary } from '../components/DashboardSummary';
import { useDashboard } from '../hooks/useDashboard';

/** Dashboard landing page for authenticated users. */
export function DashboardPage(): JSX.Element {
  const { summary } = useDashboard();

  return (
    <section>
      <h1>Dashboard Page</h1>
      <DashboardSummary summary={summary} />
    </section>
  );
}
