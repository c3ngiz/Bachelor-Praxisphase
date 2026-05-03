import type {
  SyncConnectionState,
  SyncMode,
} from "../services/documentSync";
import EditorHeader from "./EditorHeader";

type Props = {
  title: string;
  isSaving?: boolean;
  lastSavedAt?: string | null;
  revision?: number;
  canEdit: boolean;
  syncMode: SyncMode;
  connectionState: SyncConnectionState;
  conflictMessage: string | null;
  onTitleChange: (value: string) => void;
  onSyncModeChange: (mode: SyncMode) => void;
  onExportMetrics: () => void;
  onResetMetrics: () => void;
};

export default function EditorTitleBar(props: Props) {
  return <EditorHeader {...props} />;
}
