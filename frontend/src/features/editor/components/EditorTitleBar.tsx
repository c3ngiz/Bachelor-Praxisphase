import { useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";
import type { SyncMode } from "../services/documentSync";

type Props = {
  title: string;
  isSaving?: boolean;
  lastSavedAt?: string | null;
  syncMode: SyncMode;
  pollIntervalMs: number;
  metrics: {
    requests: number;
    messagesReceived: number;
    writesSent: number;
    conflicts: number;
    lastLatencyMs: number | null;
  };
  conflictMessage: string | null;
  onTitleChange: (value: string) => void;
  onSyncModeChange: (mode: SyncMode) => void;
  onPollIntervalChange: (intervalMs: number) => void;
  onExportMetrics: () => void;
};

const syncModeLabels: Record<SyncMode, string> = {
  "rest-polling": "REST polling",
  websocket: "WebSocket",
  "graphql-subscription": "GraphQL subscription",
};

export default function EditorTitleBar({
  title,
  isSaving = false,
  lastSavedAt,
  syncMode,
  pollIntervalMs,
  metrics,
  conflictMessage,
  onTitleChange,
  onSyncModeChange,
  onPollIntervalChange,
  onExportMetrics,
}: Props) {
  const navigate = useNavigate();

  const saveLabel = isSaving
    ? "Saving..."
    : lastSavedAt
      ? `Saved ${new Date(lastSavedAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`
      : "";

  return (
    <div className="border-b border-(--border) bg-(--bg-elevated) px-6 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <FileText size={22} className="shrink-0 text-emerald-500" />

          <input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="min-w-0 bg-transparent text-lg font-semibold outline-none"
          />

          {saveLabel ? (
            <span className="shrink-0 text-xs text-(--fg-muted)">{saveLabel}</span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <select
            value={syncMode}
            onChange={(event) => onSyncModeChange(event.target.value as SyncMode)}
            className="rounded-md border border-(--border) bg-(--bg) px-2 py-1"
            aria-label="Synchronization mode"
          >
            {Object.entries(syncModeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <input
            type="number"
            min={500}
            step={500}
            value={pollIntervalMs}
            onChange={(event) => onPollIntervalChange(Number(event.target.value))}
            className="w-24 rounded-md border border-(--border) bg-(--bg) px-2 py-1"
            aria-label="Polling interval in milliseconds"
            disabled={syncMode !== "rest-polling"}
          />

          <button
            onClick={onExportMetrics}
            className="rounded-md border border-(--border) px-3 py-1 hover:bg-gray-100"
          >
            Export metrics
          </button>

          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-md border border-(--border) px-3 py-1 hover:bg-gray-100"
          >
            Back
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-(--fg-muted)">
        <span>Requests {metrics.requests}</span>
        <span>Writes {metrics.writesSent}</span>
        <span>Messages {metrics.messagesReceived}</span>
        <span>Conflicts {metrics.conflicts}</span>
        <span>
          Latency {metrics.lastLatencyMs === null ? "-" : `${Math.round(metrics.lastLatencyMs)}ms`}
        </span>
        {conflictMessage ? <span className="text-red-600">{conflictMessage}</span> : null}
      </div>
    </div>
  );
}
