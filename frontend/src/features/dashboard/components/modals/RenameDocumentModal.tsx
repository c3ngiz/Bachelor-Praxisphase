import { useEffect, useState } from "react";
import { Modal, Input, Button } from "@/shared/components/ui";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  onRename: (newName: string) => void;
};

export default function RenameDocumentModal({
  isOpen,
  onClose,
  currentName,
  onRename,
}: Props) {
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setError(null);
    }
  }, [isOpen, currentName]);

  function handleSubmit() {
    if (!name.trim()) {
      setError("Document name is required");
      return;
    }

    if (name.trim() === currentName) {
      onClose();
      return;
    }

    onRename(name.trim());
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rename Document">
      <Input
        label="New Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={error ?? undefined}
        autoFocus
      />

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>
          Save
        </Button>
      </div>
    </Modal>
  );
}