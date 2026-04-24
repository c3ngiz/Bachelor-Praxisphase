import type { ReactNode } from "react";

import DashboardNavbar from "./DashboardNavbar";
import DashboardSidebar from "./DashboardSidebar";
import type { Document } from "@/features/documents";
import { useDashboardViewControls } from "../../hooks/useDashboardViewControls";
import { getDashboardCollections } from "../../utils/dashboardCollections";

type Props = {
  activeWorkspaceId: string | null;
  children: ReactNode;
  currentUserId: string | null;
  documents: Document[];
};

/**
 * DashboardLayout component.
 */
export default function DashboardLayout({
  activeWorkspaceId,
  children,
  currentUserId,
  documents,
}: Props) {
  const { activeCollection, setActiveCollection } = useDashboardViewControls();
  const collections = getDashboardCollections(
    documents,
    currentUserId,
    activeWorkspaceId,
  );

  return (
    <div className="flex min-h-screen flex-col bg-(--bg)">
      <DashboardNavbar documents={documents} />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:h-[calc(100vh-4rem)] md:flex-row">
        <DashboardSidebar
          activeCollection={activeCollection}
          collections={collections}
          onSelectCollection={setActiveCollection}
        />

        <main className="relative z-10 min-h-0 min-w-0 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
