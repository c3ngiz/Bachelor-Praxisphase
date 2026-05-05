import type { DashboardMetric } from '../types/dashboard.types';

/** Converts a metric into a short display label. */
export function formatDashboardMetric(metric: DashboardMetric): string {
  return `${metric.label}: ${metric.value}`;
}
