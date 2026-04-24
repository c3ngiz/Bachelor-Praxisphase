import { Section } from "@/shared/components/layout";

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
        <Section.Root>
          <Section.Header>
            <Section.Title>Shared with You</Section.Title>
            <Section.Description>
              Documents teammates recently shared or updated for you
            </Section.Description>
          </Section.Header>

          <Section.Body>
            <SharedWithYouDocuments
              documents={sharedWithYouDocuments}
              currentUserId={currentUserId}
              onOpenDocument={onOpenDocument}
            />
          </Section.Body>
        </Section.Root>
      ) : null}

      {teamActivityDocuments.length > 0 ? (
        <Section.Root>
          <Section.Header>
            <Section.Title>Recent Team Activity</Section.Title>
            <Section.Description>
              See what your teammates edited across shared documents
            </Section.Description>
          </Section.Header>

          <Section.Body>
            <TeamActivityFeed
              documents={teamActivityDocuments}
              onOpenDocument={onOpenDocument}
            />
          </Section.Body>
        </Section.Root>
      ) : null}

      {recentDocuments.length > 0 ? (
        <Section.Root>
          <Section.Header>
            <Section.Title>Your Recent Documents</Section.Title>
            <Section.Description>
              Jump back into the documents you opened most recently
            </Section.Description>
          </Section.Header>

          <Section.Body>
            <RecentDocuments
              documents={recentDocuments}
              onOpenDocument={onOpenDocument}
            />
          </Section.Body>
        </Section.Root>
      ) : null}
    </>
  );
}
