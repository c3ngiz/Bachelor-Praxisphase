import { useMemo } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { Document } from "@/features/documents";

type WorkspaceMember = {
  id: string;
  name: string;
  initials: string;
  color: string;
};

type Props = {
  documents: Document[];
};

function toInitials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("") || "?";
}

export default function WorkspaceMembersPreview({ documents }: Props) {
  const { user } = useAuth();

  const members = useMemo(() => {
    const mappedMembers = new Map<string, WorkspaceMember>();

    if (user) {
      mappedMembers.set(user.id, {
        id: user.id,
        name: user.name,
        initials: user.initials || toInitials(user.name),
        color: user.avatarColor,
      });
    }

    for (const document of documents) {
      mappedMembers.set(document.ownerId, {
        id: document.ownerId,
        name: document.ownerName,
        initials: toInitials(document.ownerName),
        color: "bg-slate-500",
      });

      for (const collaborator of document.collaborators ?? []) {
        mappedMembers.set(collaborator.id, {
          id: collaborator.id,
          name: collaborator.name,
          initials: collaborator.initials || toInitials(collaborator.name),
          color: collaborator.color,
        });
      }
    }

    return Array.from(mappedMembers.values());
  }, [documents, user]);

  return (
    <div className="hidden items-center gap-2 lg:flex">
      <div className="flex -space-x-2">
        {members.slice(0, 4).map((member) => (
          <div
            key={member.id}
            title={member.name}
            className={[
              "inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-(--bg-elevated) text-[11px] font-semibold text-white",
              member.color,
            ].join(" ")}
          >
            {member.initials}
          </div>
        ))}
      </div>

      <span className="text-sm text-(--fg-muted)">
        {members.length} workspace member{members.length === 1 ? "" : "s"}
      </span>
    </div>
  );
}