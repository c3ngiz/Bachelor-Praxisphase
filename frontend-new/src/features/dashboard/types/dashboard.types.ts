/** High-level dashboard metric item. */
export interface DashboardMetric {
  /** Metric label shown in the dashboard. */
  label: string;
  /** Metric numeric value. */
  value: number;
}

/** Dashboard summary response shape. */
export interface DashboardSummaryData {
  /** Collection of dashboard metrics. */
  metrics: DashboardMetric[];
}
