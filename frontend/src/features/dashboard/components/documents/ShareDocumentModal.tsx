import { useEffect, useMemo, useState } from "react";
import { Link2, MailPlus } from "lucide-react";

import { Button, Input, Modal, Notice, Select } from "@/shared/components/ui";
import { useAuth } from "@/features/auth";
import type { Document, DocumentRole } from "@/features/documents";
import { useDocumentsStore } from "@/features/documents";
import { useWorkspacesStore } from "@/features/workspaces";
import type { WorkspaceRole } from "@/features/workspaces";

type Props = {
  document: Document;
  isOpen: boolean;
  onClose: () => void;
};

const ROLE_OPTIONS = [
  { value: "editor", label: "Can edit" },
  { value: "viewer", label: "Can view" },
];

const ACCESS_OPTIONS = [
  { value: "private", label: "Private" },
  { value: "shared", label: "Shared with invited people" },
  { value: "workspace", label: "Workspace" },
];

type AccessPerson = {
  id: string;
  name: string;
  initials: string;
  color: string;
  role: DocumentRole | WorkspaceRole;
  accessScope?: "workspace";
};

/**
 * ShareDocumentModal component.
 */
export default function ShareDocumentModal({
  document,
  isOpen,
  onClose,
}: Props) {
  const { token } = useAuth();
  const inviteDocumentCollaborator = useDocumentsStore(
    (state) => state.inviteDocumentCollaborator,
  );
  const activeWorkspace = useWorkspacesStore((state) => state.activeWorkspace);
  const workspaces = useWorkspacesStore((state) => state.workspaces);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [access, setAccess] = useState(document.visibility);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const documentWorkspace =
    workspaces.find((workspace) => workspace.id === document.workspaceId) ??
    activeWorkspace;
  const accessOptions = documentWorkspace?.isDefault
    ? ACCESS_OPTIONS.map((option) =>
        option.value === "workspace"
          ? {
              ...option,
              label: "Anyone in private workspace (only you)",
            }
          : option,
      )
    : ACCESS_OPTIONS.filter((option) => option.value !== "private");
  const peopleWithAccess = useMemo<AccessPerson[]>(() => {
    const people = new Map<string, AccessPerson>();
    const documentCollaborators = document.collaborators ?? [];

    for (const collaborator of documentCollaborators) {
      people.set(collaborator.id, collaborator);
    }

    if (access === "workspace" && documentWorkspace && !documentWorkspace.isDefault) {
      for (const member of documentWorkspace.members) {
        if (people.has(member.userId)) continue;

        people.set(member.userId, {
          id: member.userId,
          name: member.name,
          initials: member.initials,
          color: member.avatarColor,
          role: member.role,
          accessScope: "workspace",
        });
      }
    }

    return Array.from(people.values());
  }, [access, document.collaborators, documentWorkspace]);

  useEffect(() => {
    setAccess(document.visibility);
  }, [document.id, document.visibility]);

  async function handleInvite() {
    if (!token || !document.canShare) return;

    try {
      setIsSubmitting(true);
      await inviteDocumentCollaborator(
        document.id,
        {
          email,
          role: role as "editor" | "viewer",
        },
        token,
      );
      setEmail("");
      setError(null);
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to invite document collaborator.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCopyLink() {
    navigator.clipboard?.writeText(`https://docflow.local/document/${document.id}`);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header>
        <div>
          <Modal.Title>{`Share “${document.title}”`}</Modal.Title>
          <Modal.Description>
            Invite teammates and manage access for this document.
          </Modal.Description>
        </div>
      </Modal.Header>

      <Modal.Body>
        <Notice>
          <Notice.Description>
            Invite teammates and manage access for this document.
          </Notice.Description>
        </Notice>

        <Input
          label="Invite by email"
          placeholder="name@company.com"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (error) setError(null);
          }}
          disabled={isSubmitting || !document.canShare}
        />

        <Select
          label="Permission"
          value={role}
          onChange={(event) => setRole(event.target.value)}
          options={ROLE_OPTIONS}
          disabled={isSubmitting || !document.canShare}
        />

        <Select
          label="General access"
          value={access}
          onChange={(event) =>
            setAccess(event.target.value as Document["visibility"])
          }
          options={accessOptions}
          disabled={!document.canShare}
        />

        {documentWorkspace?.isDefault ? (
          <Notice>
            <Notice.Description>
              Your default workspace cannot be shared as a whole. Use individual
              document invites when other people need access.
            </Notice.Description>
          </Notice>
        ) : null}

        {error ? (
          <Notice variant="danger">
            <Notice.Description>{error}</Notice.Description>
          </Notice>
        ) : null}

        <Notice className="space-y-3">
          <div className="mb-2 text-sm font-medium text-(--fg)">
            People with access
          </div>

          <div className="space-y-2">
            {peopleWithAccess.map((person) => (
              <div
                key={person.id}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={[
                      "inline-flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold text-white",
                      person.color,
                    ].join(" ")}
                  >
                    {person.initials}
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-(--fg)">
                      {person.name}
                    </div>
                    <div className="truncate text-xs text-(--fg-muted)">
                      {person.accessScope === "workspace"
                        ? `workspace ${person.role}`
                        : person.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Notice>
      </Modal.Body>

      <Modal.Footer className="flex-wrap justify-between">
        <div className="mr-auto">
          <Button variant="ghost" onClick={handleCopyLink}>
            <Link2 size={16} />
            Copy link
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>

          <Button
            onClick={() => void handleInvite()}
            disabled={!email.trim() || isSubmitting || !document.canShare}
          >
            <MailPlus size={16} />
            {isSubmitting ? "Inviting..." : "Invite"}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
