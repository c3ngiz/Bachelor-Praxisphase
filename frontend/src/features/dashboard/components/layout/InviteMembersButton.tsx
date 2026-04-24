import { useState } from "react";
import { MailPlus, UserPlus } from "lucide-react";

import { Button, Input, Modal, Notice, Select } from "@/shared/components/ui";

const ROLE_OPTIONS = [
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer" },
];

/**
 * InviteMembersButton component.
 */
export default function InviteMembersButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");

  function handleInvite() {
    setEmail("");
    setRole("editor");
    setIsOpen(false);
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
              Add teammates to DocFlow Team and configure their access.
            </Modal.Description>
          </div>
        </Modal.Header>

        <Modal.Body>
          <Notice>
            <Notice.Description>
              Add teammates to{" "}
              <span className="font-medium text-(--fg)">DocFlow Team</span> and
              let them collaborate across shared documents.
            </Notice.Description>
          </Notice>

          <Input
            label="Email address"
            placeholder="name@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <Select
            label="Role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            options={ROLE_OPTIONS}
          />
        </Modal.Body>

        <Modal.Footer>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>

          <Button onClick={handleInvite} disabled={!email.trim()}>
            <MailPlus size={16} />
            Send invite
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
