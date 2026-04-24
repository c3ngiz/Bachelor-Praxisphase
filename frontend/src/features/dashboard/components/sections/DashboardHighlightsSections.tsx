import { Section, SectionHeader } from "@/shared/components/layout";

import type { Document } from "@/features/documents";

import RecentDocuments from "../documents/RecentDocuments";
import SharedWithYouDocuments from "../documents/SharedWithYouDocuments";
import TeamActivityFeed from "../documents/TeamActivityFeed";

type Props = {
  sharedWithYouDocuments: Document[];
  teamActivityDocuments: Document[];
  recentDocuments: Document[];
  currentUserId: string | null;
  onOpenDocument: (id: string) => void;
};

/**
 * Renders top dashboard document insight sections.
 */
export default function DashboardHighlightsSections({
  sharedWithYouDocuments,
  teamActivityDocuments,
  recentDocuments,
  currentUserId,
  onOpenDocument,
}: Props) {
  return (
    <>
      {sharedWithYouDocuments.length > 0 ? (
        <Section>
          <SectionHeader
            title="Shared with You"
            description="Documents teammates recently shared or updated for you"
          />

          <SharedWithYouDocuments
            documents={sharedWithYouDocuments}
            currentUserId={currentUserId}
            onOpenDocument={onOpenDocument}
          />
        </Section>
      ) : null}

      {teamActivityDocuments.length > 0 ? (
        <Section>
          <SectionHeader
            title="Recent Team Activity"
            description="See what your teammates edited across shared documents"
          />

          <TeamActivityFeed
            documents={teamActivityDocuments}
            onOpenDocument={onOpenDocument}
          />
        </Section>
      ) : null}

      {recentDocuments.length > 0 ? (
        <Section>
          <SectionHeader
            title="Your Recent Documents"
            description="Jump back into the documents you opened most recently"
          />

          <RecentDocuments
            documents={recentDocuments}
            onOpenDocument={onOpenDocument}
          />
        </Section>
      ) : null}
    </>
  );
}
