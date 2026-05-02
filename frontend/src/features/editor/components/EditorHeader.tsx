import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import AppLogo from "@/features/dashboard/components/layout/AppLogo";
import { Button } from "@/shared/components/ui";
import type { SyncMode } from "../services/documentSync";
import EditorDocumentTitle from "./EditorDocumentTitle";
import SyncDiagnosticsPanel from "./SyncDiagnosticsPanel";

type Props = {
  title: string;
  isSaving?: boolean;
  lastSavedAt?: string | null;
  revision?: number;
  syncMode: SyncMode;
  conflictMessage: string | null;
  onTitleChange: (value: string) => void;
  onSyncModeChange: (mode: SyncMode) => void;
  onExportMetrics: () => void;
};

export default function EditorHeader({
  title,
  isSaving = false,
  lastSavedAt,
  revision,
  syncMode,
  conflictMessage,
  onTitleChange,
  onSyncModeChange,
  onExportMetrics,
}: Props) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-[#030618] px-4 py-2 text-white shadow-[0_10px_26px_rgba(3,6,24,0.18)] sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          aria-label="Back to dashboard"
          className="shrink-0 border-white/10 bg-white/6 text-white hover:border-white/25 hover:bg-white/12 hover:text-white"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft size={16} />
        </Button>

        <div className="hidden shrink-0 sm:block">
          <AppLogo
            labelClassName="hidden text-[17px] font-semibold text-white lg:block"
            className="text-white"
          />
        </div>

        <span className="hidden h-6 w-px shrink-0 bg-white/12 lg:block" />

        <EditorDocumentTitle
          title={title}
          isSaving={isSaving}
          lastSavedAt={lastSavedAt}
          revision={revision}
          onTitleChange={onTitleChange}
        />

        <SyncDiagnosticsPanel
          syncMode={syncMode}
          conflictMessage={conflictMessage}
          onSyncModeChange={onSyncModeChange}
          onExportMetrics={onExportMetrics}
        />
      </div>
    </header>
  );
}
