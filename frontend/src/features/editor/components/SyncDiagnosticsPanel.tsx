import { Braces, Download, Radio, RefreshCcw, RotateCcw } from "lucide-react";

import { Badge, Button, SegmentedControl } from "@/shared/components/ui";
import type { SegmentedControlOption } from "@/shared/components/ui";
import type {
  SyncConnectionState,
  SyncMode,
} from "../services/documentSync";

type Props = {
  syncMode: SyncMode;
  connectionState: SyncConnectionState;
  conflictMessage: string | null;
  onSyncModeChange: (mode: SyncMode) => void;
  onExportMetrics: () => void;
  onResetMetrics: () => void;
};

const syncModeOptions: SegmentedControlOption<SyncMode>[] = [
  {
    value: "rest-polling",
    label: "REST",
    icon: <RefreshCcw size={14} />,
  },
  {
    value: "websocket",
    label: "WebSocket",
    icon: <Radio size={14} />,
  },
  {
    value: "graphql-subscription",
    label: "GraphQL",
    icon: <Braces size={14} />,
  },
];

const stateLabel: Record<SyncConnectionState, string> = {
  connected: "Connected",
  disconnected: "Offline",
  polling: "Polling",
  reconnecting: "Reconnecting",
  error: "Sync error",
};

const stateClassName: Record<SyncConnectionState, string> = {
  connected: "bg-white/10 text-white/72",
  disconnected: "bg-white/10 text-white/56",
  polling: "bg-indigo-100 text-indigo-700",
  reconnecting: "bg-amber-100 text-amber-800",
  error: "bg-red-100 text-red-700",
};

export default function SyncDiagnosticsPanel({
  syncMode,
  connectionState,
  conflictMessage,
  onSyncModeChange,
  onExportMetrics,
  onResetMetrics,
}: Props) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <SegmentedControl
        ariaLabel="Synchronization mode"
        value={syncMode}
        options={syncModeOptions}
        onChange={onSyncModeChange}
        className="h-9 border-white/10 bg-white/7 p-0.5 [&_button]:h-8 [&_button[aria-pressed='false']]:text-white/66 [&_button[aria-pressed='false']:hover]:bg-white/10 [&_button[aria-pressed='false']:hover]:text-white"
      />

      <Badge
        variant="subtle"
        size="md"
        className={stateClassName[connectionState]}
      >
        {stateLabel[connectionState]}
      </Badge>

      {conflictMessage ? (
        <Badge variant="danger" size="md" title={conflictMessage}>
          Conflict
        </Badge>
      ) : null}

      <Button
        variant="secondary"
        size="sm"
        iconOnly
        aria-label="Reset sync metrics"
        className="border-white/10 bg-white/7 text-white hover:border-white/28 hover:bg-white/12 hover:text-white"
        onClick={onResetMetrics}
      >
        <RotateCcw size={15} />
      </Button>

      <Button
        variant="secondary"
        size="sm"
        iconOnly
        aria-label="Export sync metrics"
        className="border-white/10 bg-white/7 text-white hover:border-white/28 hover:bg-white/12 hover:text-white"
        onClick={onExportMetrics}
      >
        <Download size={15} />
      </Button>
    </div>
  );
}
