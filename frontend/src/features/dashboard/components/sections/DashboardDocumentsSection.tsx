import { Plus } from "lucide-react";

import { Section } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui";

import type { Document } from "@/features/documents";
import type { WorkspaceMember } from "@/features/workspaces";
import type { DashboardCollectionId } from "../../utils/dashboardCollections";

import DocumentsContainer from "../documents/DocumentsContainer";
import FilterDropdown from "../toolbar/FilterDropdown";
import SortDropdown from "../toolbar/SortDropdown";
import ViewDropdown from "../toolbar/ViewDropdown";

type ViewMode = "grid" | "list";

type Props = {
  collectionDescription: string;
  collectionId: DashboardCollectionId;
  collectionLabel: string;
  collectionTotal: number;
  documents: Document[];
  viewMode: ViewMode;
  loading: boolean;
  onOpenDocument: (id: string) => void;
  onRenameDocument: (id: string) => void;
  onDeleteDocument: (id?: string) => void;
  onCreateDocument: () => void;
  workspaceMembers: WorkspaceMember[];
  workspaceName?: string;
};

/**
 * Renders the main all-documents section with toolbar and list/grid content.
 */
export default function DashboardDocumentsSection({
  collectionDescription,
  collectionId,
  collectionLabel,
  collectionTotal,
  documents,
  viewMode,
  loading,
  onOpenDocument,
  onRenameDocument,
  onDeleteDocument,
  onCreateDocument,
  workspaceMembers,
  workspaceName,
}: Props) {
  const isAllDocuments = collectionId === "all";
  const emptyCopy = getEmptyCopy(collectionId);

  return (
    <Section.Root
      className="
        min-h-full p-0
      "
    >
      <Section.Header
        className="gap-5"
        actions={
          <Section.Actions className="flex-wrap">
            <SortDropdown />
            <FilterDropdown />
            <ViewDropdown />
            <Button onClick={onCreateDocument} className="flex items-center gap-2">
              <Plus size={16} />
              New
            </Button>
          </Section.Actions>
        }
      >
        <div className="flex flex-col gap-1">
          <Section.Title className="text-2xl font-bold text-[#030618] sm:text-3xl">
            Documents
          </Section.Title>
          <Section.Description className="text-sm text-(--fg-muted)">
            {workspaceName ? `${workspaceName} · ` : ""}
            {collectionLabel} · {collectionTotal} document
            {collectionTotal === 1 ? "" : "s"}
          </Section.Description>
          <p className="max-w-2xl text-sm leading-6 text-(--fg-muted)">
            {collectionDescription}
          </p>
        </div>
      </Section.Header>

      <Section.Body className="pt-2">
        <DocumentsContainer
          documents={documents}
          viewMode={viewMode}
          loading={loading}
          emptyTitle={emptyCopy.title}
          emptyDescription={emptyCopy.description}
          emptyShowCreateAction={isAllDocuments}
          workspaceMembers={workspaceMembers}
          onOpen={onOpenDocument}
          onRename={onRenameDocument}
          onDelete={onDeleteDocument}
          onCreate={onCreateDocument}
        />
      </Section.Body>
    </Section.Root>
  );
}

function getEmptyCopy(collectionId: DashboardCollectionId) {
  switch (collectionId) {
    case "shared":
      return {
        title: "No documents shared with you",
        description:
          "Ask your collaborators for a link or invite to join their shared documents.",
      };
    case "recent":
      return {
        title: "No recent documents",
        description:
          "Documents you open, touch, or edit will appear here for quick access.",
      };
    case "activity":
      return {
        title: "No team activity yet",
        description:
          "Files your team touches will appear here once collaboration starts.",
      };
    case "empty":
      return {
        title: "No empty drafts",
        description: "Drafts without content will appear here.",
      };
    default:
      return {
        title: "No documents yet",
        description:
          "Create your first document to start writing and collaborating.",
      };
  }
}
