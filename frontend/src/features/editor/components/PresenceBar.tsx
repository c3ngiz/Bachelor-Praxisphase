import { Clock3, Users } from "lucide-react";

import type {
  PresenceUser,
  SyncConnectionState,
} from "../services/documentSync";
import type { EditorSyncMetrics } from "../types";

type Props = {
  metrics: EditorSyncMetrics;
  pollIntervalMs: number;
  connectionState: SyncConnectionState;
  presenceUsers: PresenceUser[];
  onPollIntervalChange: (intervalMs: number) => void;
};

function MetricItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <span className="whitespace-nowrap">
      {label} <span className="font-semibold text-(--fg)">{value}</span>
    </span>
  );
}

function PresencePill({ user }: { user: PresenceUser }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-(--bg-subtle) px-2 py-1 text-xs font-semibold text-(--fg)">
      <span
        className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-(--accent) text-[9px] text-white"
        title={user.name}
      >
        {user.initials}
      </span>
      {user.name}
    </span>
  );
}

export default function PresenceBar({
  metrics,
  pollIntervalMs,
  connectionState,
  presenceUsers,
  onPollIntervalChange,
}: Props) {
  const presenceLabel =
    presenceUsers.length > 0
      ? `${presenceUsers.length} collaborator${
          presenceUsers.length > 1 ? "s" : ""
        } connected`
      : "No collaborators connected";

  return (
    <footer className="border-t border-(--border) bg-(--bg-elevated)/95 px-4 py-2 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-(--fg-muted) sm:text-sm">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Users size={15} className="text-(--accent)" />
          <span>{presenceLabel}</span>
          {presenceUsers.map((user) => (
            <PresencePill key={user.id} user={user} />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <MetricItem label="State" value={connectionState} />
          <MetricItem label="Requests" value={metrics.requests} />
          <MetricItem label="Messages" value={metrics.messagesReceived} />
          <MetricItem label="Conflicts" value={metrics.conflicts} />
          <MetricItem
            label="Latency"
            value={
              metrics.latestLatencyMs === null
                ? "-"
                : `${Math.round(metrics.latestLatencyMs)}ms`
            }
          />
          <MetricItem
            label="Avg"
            value={
              metrics.averageLatencyMs === null
                ? "-"
                : `${Math.round(metrics.averageLatencyMs)}ms`
            }
          />
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <Clock3 size={14} />
            Poll
            <input
              aria-label="Polling interval in milliseconds"
              type="number"
              min={500}
              step={500}
              value={pollIntervalMs}
              onChange={(event) => onPollIntervalChange(Number(event.target.value))}
              className="h-7 w-20 rounded-md border border-(--border) bg-(--bg-subtle) px-2 text-xs font-semibold text-(--fg) outline-none focus:border-(--accent)"
            />
            ms
          </span>
        </div>
      </div>
    </footer>
  );
}
