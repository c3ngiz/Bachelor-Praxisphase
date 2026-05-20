import type { PlainTextMetrics } from '../types/editor.types';

/** Props accepted by the collaboration metrics panel. */
export interface CollaborationMetricsPanelProps {
  /** Client-side metrics collected by the editor hook. */
  metrics: PlainTextMetrics;
}

/**
 * Compact metrics panel for client-side OT measurements.
 *
 * @param props - Metrics panel props.
 * @returns Metrics rows suitable for the editor sidebar.
 */
export function CollaborationMetricsPanel({
  metrics,
}: CollaborationMetricsPanelProps): JSX.Element {
  return (
    <div className="grid gap-2">
      <MetricRow label="Sent" value={String(metrics.sentOps)} />
      <MetricRow label="Acked" value={String(metrics.ackedOps)} />
      <MetricRow label="Pending" value={String(metrics.pendingOps)} />
      <MetricRow label="Remote ops" value={String(metrics.receivedRemoteOps)} />
      <MetricRow label="Transforms" value={String(metrics.transformedOps)} />
      <MetricRow label="I/I" value={String(metrics.transformCaseCounts['insert/insert'])} />
      <MetricRow label="I/D" value={String(metrics.transformCaseCounts['insert/delete'])} />
      <MetricRow label="D/I" value={String(metrics.transformCaseCounts['delete/insert'])} />
      <MetricRow label="D/D" value={String(metrics.transformCaseCounts['delete/delete'])} />
      <MetricRow label="Last ack" value={formatMs(metrics.lastAckLatencyMs)} />
      <MetricRow label="Avg ack" value={formatMs(metrics.avgAckLatencyMs)} />
      <MetricRow label="Server" value={formatMs(metrics.avgServerProcessingMs)} />
    </div>
  );
}

/** Props accepted by a compact metric row. */
interface MetricRowProps {
  /** Metric label. */
  label: string;
  /** Metric value. */
  value: string;
}

/**
 * Renders one label/value metric row.
 *
 * @param props - Metric row props.
 * @returns Compact metric row.
 */
function MetricRow({ label, value }: MetricRowProps): JSX.Element {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="min-w-0 truncate text-right font-medium text-slate-800">{value}</span>
    </div>
  );
}

/**
 * Formats a millisecond value for compact display.
 *
 * @param value - Millisecond value or null.
 * @returns Display value.
 */
function formatMs(value: number | null): string {
  return value === null ? '-' : `${value.toFixed(1)} ms`;
}
