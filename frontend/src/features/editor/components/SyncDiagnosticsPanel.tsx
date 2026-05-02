import { Braces, Download, Radio, RefreshCcw } from "lucide-react";

import { Badge, Button, SegmentedControl } from "@/shared/components/ui";
import type { SegmentedControlOption } from "@/shared/components/ui";
import type { SyncMode } from "../services/documentSync";

type Props = {
  syncMode: SyncMode;
  conflictMessage: string | null;
  onSyncModeChange: (mode: SyncMode) => void;
  onExportMetrics: () => void;
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

export default function SyncDiagnosticsPanel({
  syncMode,
  conflictMessage,
  onSyncModeChange,
  onExportMetrics,
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

      {conflictMessage ? (
        <Badge variant="danger" size="md">
          Conflict
        </Badge>
      ) : null}

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
