import Section from "@/shared/components/layout/Section";
import SectionHeader from "@/shared/components/layout/SectionHeader";

import type { Document } from "@/features/documents";

import DocumentsContainer from "../documents/DocumentsContainer";
import FilterDropdown from "../toolbar/FilterDropdown";
import SortDropdown from "../toolbar/SortDropdown";
import ViewDropdown from "../toolbar/ViewDropdown";

type ViewMode = "grid" | "list";

type Props = {
  documents: Document[];
  viewMode: ViewMode;
  loading: boolean;
  onOpenDocument: (id: string) => void;
  onRenameDocument: (id: string) => void;
  onDeleteDocument: (id?: string) => void;
  onCreateDocument: () => void;
};

/**
 * Renders the main all-documents section with toolbar and list/grid content.
 */
export default function DashboardDocumentsSection({
  documents,
  viewMode,
  loading,
  onOpenDocument,
  onRenameDocument,
  onDeleteDocument,
  onCreateDocument,
}: Props) {
  return (
    <Section variant="subtle" fullBleed>
      <SectionHeader
        title="All Documents"
        description="Browse and manage your documents"
        right={
          <div
            className="
              flex h-11 items-center gap-1 rounded-xl border border-(--border)
              bg-(--bg-elevated) p-1
              shadow-[0_2px_8px_rgba(60,64,67,0.08)]
            "
          >
            <SortDropdown />
            <FilterDropdown />
            <ViewDropdown />
          </div>
        }
      />

      <DocumentsContainer
        documents={documents}
        viewMode={viewMode}
        loading={loading}
        onOpen={onOpenDocument}
        onRename={onRenameDocument}
        onDelete={onDeleteDocument}
        onCreate={onCreateDocument}
      />
    </Section>
  );
}
