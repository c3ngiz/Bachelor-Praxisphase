import { formatDashboardMetric } from '../utils/dashboard.utils';
import type { DashboardSummaryData } from '../types/dashboard.types';

/** Props for the dashboard summary component. */
export interface DashboardSummaryProps {
  /** Summary data rendered in the dashboard. */
  summary: DashboardSummaryData;
}

/** Displays key dashboard metrics. */
export function DashboardSummary({ summary }: DashboardSummaryProps): JSX.Element {
  return (
    <section aria-label="Dashboard summary">
      <h2>Dashboard Summary</h2>
      <ul>
        {summary.metrics.map((metric) => (
          <li key={metric.label}>{formatDashboardMetric(metric)}</li>
        ))}
      </ul>
    </section>
  );
}
