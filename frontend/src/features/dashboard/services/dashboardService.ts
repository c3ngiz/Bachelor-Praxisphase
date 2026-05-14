import type { DashboardSummaryData } from '../types/dashboard.types';

/** Service facade for dashboard data. */
export const dashboardService = {
  /** Returns mocked dashboard summary data. */
  async getSummary(): Promise<DashboardSummaryData> {
    return {
      metrics: [
        { label: 'Documents', value: 12 },
        { label: 'Drafts', value: 3 },
      ],
    };
  },
};
