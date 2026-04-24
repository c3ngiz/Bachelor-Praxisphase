import { useState } from "react";
import { Link2, MailPlus } from "lucide-react";

import { Button, Input, Modal, Notice, Select } from "@/shared/components/ui";
import type { Document } from "@/features/documents";

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
  { value: "workspace", label: "Anyone in workspace" },
];

/**
 * ShareDocumentModal component.
 */
export default function ShareDocumentModal({
  document,
  isOpen,
  onClose,
}: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [access, setAccess] = useState(document.visibility);
  const collaborators = document.collaborators ?? [];

  function handleInvite() {
    setEmail("");
    onClose();
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
          onChange={(event) => setEmail(event.target.value)}
        />

        <Select
          label="Permission"
          value={role}
          onChange={(event) => setRole(event.target.value)}
          options={ROLE_OPTIONS}
        />

        <Select
          label="General access"
          value={access}
          onChange={(event) =>
            setAccess(event.target.value as Document["visibility"])
          }
          options={ACCESS_OPTIONS}
        />

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
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>

          <Button onClick={handleInvite} disabled={!email.trim()}>
            <MailPlus size={16} />
            Invite
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
