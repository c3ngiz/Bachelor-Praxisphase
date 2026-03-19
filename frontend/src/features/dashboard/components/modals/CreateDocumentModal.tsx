import { useState } from "react";
import { Modal, Input, Button } from "@/shared/components/ui";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
};

export default function CreateDocumentModal({ isOpen, onClose, onCreate }: Props) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    if (!name.trim()) {
      setError("Document name is required");
      return;
    }

    onCreate(name.trim());
    setName("");
    setError(null);
    onClose();
  }

  function handleClose() {
    setName("");
    setError(null);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Document">
      <Input
        label="Document Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={error ?? undefined}
        autoFocus
      />

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={handleClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>
          Create
        </Button>
      </div>
    </Modal>
  );
}