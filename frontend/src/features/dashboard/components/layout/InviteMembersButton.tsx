import { useState } from "react";
import { MailPlus, UserPlus } from "lucide-react";

import { Button, Input, Modal, Notice, Select } from "@/shared/components/ui";
import { useAuth } from "@/features/auth";
import { useWorkspacesStore, type WorkspaceRole } from "@/features/workspaces";

const ROLE_OPTIONS = [
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer" },
];

/**
 * InviteMembersButton component.
 */
export default function InviteMembersButton() {
  const { token } = useAuth();
  const { activeWorkspace, inviteMember } = useWorkspacesStore();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("editor");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleInvite() {
    if (!token || !activeWorkspace || activeWorkspace.isDefault) return;

    try {
      setIsSubmitting(true);
      await inviteMember(
        activeWorkspace.id,
        {
          email,
          role,
        },
        token,
      );
      setEmail("");
      setRole("editor");
      setError(null);
      setIsOpen(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to invite workspace member.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="h-10 rounded-xl px-3"
      >
        <UserPlus size={16} />
        Invite
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      >
        <Modal.Header>
          <div>
            <Modal.Title>Invite people to workspace</Modal.Title>
            <Modal.Description>
              Add teammates to {activeWorkspace?.name ?? "this workspace"} and configure their access.
            </Modal.Description>
          </div>
        </Modal.Header>

        <Modal.Body>
          {activeWorkspace?.isDefault ? (
            <Notice>
              <Notice.Description>
                Your default workspace is private and cannot be shared as a
                whole. You can still share individual documents from it.
              </Notice.Description>
            </Notice>
          ) : (
            <Notice>
              <Notice.Description>
                Invite an existing registered user to{" "}
                <span className="font-medium text-(--fg)">
                  {activeWorkspace?.name ?? "this workspace"}
                </span>
                .
              </Notice.Description>
            </Notice>
          )}

          {error ? (
            <Notice variant="danger">
              <Notice.Description>{error}</Notice.Description>
            </Notice>
          ) : null}

          {!activeWorkspace?.isDefault ? (
            <>
              <Input
                label="Email address"
                placeholder="name@company.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (error) setError(null);
                }}
                disabled={isSubmitting}
              />

              <Select
                label="Role"
                value={role}
                onChange={(event) => setRole(event.target.value as WorkspaceRole)}
                options={ROLE_OPTIONS}
                disabled={isSubmitting}
              />
            </>
          ) : null}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>

          {!activeWorkspace?.isDefault ? (
            <Button
              onClick={() => void handleInvite()}
              disabled={!email.trim() || isSubmitting}
            >
              <MailPlus size={16} />
              {isSubmitting ? "Inviting..." : "Send invite"}
            </Button>
          ) : null}
        </Modal.Footer>
      </Modal>
    </>
  );
}
