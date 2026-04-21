import { ArrowUpRight, Share2, Users } from "lucide-react";

import Card from "@/shared/components/ui/Card";
import type { Document } from "../types/document.types";

type Props = {
  documents: Document[];
  currentUserId: string | null;
  onOpenDocument?: (documentId: string) => void;
};

function getPermissionLabel(document: Document, currentUserId: string | null) {
  if (!currentUserId) {
    return "Can view";
  }

  const currentUser = document.collaborators.find(
    (collaborator) => collaborator.id === currentUserId,
  );

  switch (currentUser?.role) {
    case "owner":
      return "Owner";
    case "editor":
      return "Can edit";
    default:
      return "Can view";
  }
}

function getVisibilityLabel(document: Document) {
  switch (document.visibility) {
    case "workspace":
      return "Team";
    case "shared":
      return "Shared";
    default:
      return "Private";
  }
}

export default function SharedWithYouDocuments({
  documents,
  currentUserId,
  onOpenDocument,
}: Props) {
  if (documents.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {documents.map((doc) => (
        <Card
          key={doc.id}
          interactive
          hoverable
          padding="none"
          shadow="sm"
          className="
            min-h-36 cursor-pointer overflow-hidden
            transition-[transform,border-color,box-shadow,background-color] duration-150
            hover:border-[color:color-mix(in_srgb,var(--border)_65%,var(--fg)_35%)]
            hover:bg-[color:color-mix(in_srgb,var(--bg-elevated)_88%,white_12%)]
            hover:shadow-[0_10px_28px_rgba(15,23,42,0.08)]
            focus-within:ring-2 focus-within:ring-(--focus-ring)
          "
          onClick={() => onOpenDocument?.(doc.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onOpenDocument?.(doc.id);
            }
          }}
        >
          <Card.Header padding="md">
            <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-(--border) bg-(--bg-subtle) text-(--fg-muted)">
              <Share2 size={18} />
            </div>

            <div className="inline-flex items-center gap-1 rounded-lg bg-(--bg-subtle) px-2.5 py-1 text-xs font-medium text-(--fg-muted)">
              <Users size={13} />
              {getVisibilityLabel(doc)}
            </div>
          </Card.Header>

          <Card.Content padding="md" className="flex-1 pt-0">
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-base font-semibold leading-6 text-(--fg)">
                {doc.title}
              </h3>

              <p className="mt-2 text-sm text-(--fg-muted)">
                Shared by {doc.ownerName}
              </p>
            </div>
          </Card.Content>

          <Card.Footer
            padding="md"
            className="flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <div className="text-xs font-medium uppercase tracking-wide text-(--fg-muted)">
                Access
              </div>
              <div className="mt-1 truncate text-sm text-(--fg)">
                {getPermissionLabel(doc, currentUserId)}
              </div>
            </div>

            <span
              className="
                inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl
                border border-(--border) bg-(--bg-subtle) text-(--fg-muted)
                transition-[transform,color,border-color,background-color] duration-150
                group-hover:border-[color:color-mix(in_srgb,var(--border)_60%,var(--fg)_40%)]
                group-hover:bg-(--bg) group-hover:text-(--fg)
              "
              aria-hidden="true"
            >
              <ArrowUpRight
                size={16}
                className="transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </span>
          </Card.Footer>
        </Card>
      ))}
    </div>
  );
}