import { useState } from "react";
import { Link2, MailPlus } from "lucide-react";

import { Button, Input, Modal, Notice, Select } from "@/shared/components/ui";
import { useAuth } from "@/features/auth";
import type { Document } from "@/features/documents";
import { useDocumentsStore } from "@/features/documents";
import { useWorkspacesStore } from "@/features/workspaces";

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
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [access, setAccess] = useState(document.visibility);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const collaborators = document.collaborators ?? [];
  const accessOptions = activeWorkspace?.isDefault
    ? ACCESS_OPTIONS.map((option) =>
        option.value === "workspace"
          ? {
              ...option,
              label: "Anyone in private workspace (only you)",
            }
          : option,
      )
    : ACCESS_OPTIONS.filter((option) => option.value !== "private");

  async function handleInvite() {
    if (!token) return;

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
          disabled={isSubmitting}
        />

        <Select
          label="Permission"
          value={role}
          onChange={(event) => setRole(event.target.value)}
          options={ROLE_OPTIONS}
          disabled={isSubmitting}
        />

        <Select
          label="General access"
          value={access}
          onChange={(event) =>
            setAccess(event.target.value as Document["visibility"])
          }
          options={accessOptions}
        />

        {activeWorkspace?.isDefault ? (
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
            {collaborators.map((collaborator) => (
              <div
                key={collaborator.id}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={[
                      "inline-flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold text-white",
                      collaborator.color,
                    ].join(" ")}
                  >
                    {collaborator.initials}
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-(--fg)">
                      {collaborator.name}
                    </div>
                    <div className="truncate text-xs text-(--fg-muted)">
                      {collaborator.role}
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
            disabled={!email.trim() || isSubmitting}
          >
            <MailPlus size={16} />
            {isSubmitting ? "Inviting..." : "Invite"}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
