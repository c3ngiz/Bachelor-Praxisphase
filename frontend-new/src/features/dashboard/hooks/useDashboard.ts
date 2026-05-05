import { useMemo } from 'react';
import type { DashboardSummaryData } from '../types/dashboard.types';

/** Return value for dashboard state. */
export interface UseDashboardResult {
  /** Mocked dashboard summary data. */
  summary: DashboardSummaryData;
}

/** Provides dashboard state for dashboard screens. */
export function useDashboard(): UseDashboardResult {
  const summary = useMemo<DashboardSummaryData>(
    () => ({
      metrics: [
        { label: 'Documents', value: 12 },
        { label: 'Drafts', value: 3 },
      ],
    }),
    [],
  );

  return { summary };
}
