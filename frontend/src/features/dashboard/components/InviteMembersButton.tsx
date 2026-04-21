import { useState } from "react";
import { MailPlus, UserPlus } from "lucide-react";

import { Button, Input, Modal, Select } from "@/shared/components/ui";

const ROLE_OPTIONS = [
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer" },
];

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
        title="Invite people to workspace"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-(--border) bg-(--bg) px-4 py-3 text-sm text-(--fg-muted)">
            Add teammates to <span className="font-medium text-(--fg)">DocFlow Team</span> and let them collaborate across shared documents.
          </div>

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

          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>

            <Button onClick={handleInvite} disabled={!email.trim()}>
              <MailPlus size={16} />
              Send invite
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}