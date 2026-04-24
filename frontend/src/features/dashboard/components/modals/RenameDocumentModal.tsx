import { useEffect, useState } from "react";
import { Button, Input, Modal } from "@/shared/components/ui";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  onRename: (newName: string) => Promise<void> | void;
};

/**
 * RenameDocumentModal component.
 */
export default function RenameDocumentModal({
  isOpen,
  onClose,
  currentName,
  onRename,
}: Props) {
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, currentName]);

  async function handleSubmit() {
    if (!name.trim()) {
      setError("Document name is required");
      return;
    }

    if (name.trim() === currentName) {
      onClose();
      return;
    }

    try {
      setIsSubmitting(true);
      await onRename(name.trim());
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to rename document.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    if (isSubmitting) return;
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <Modal.Header>
        <div>
          <Modal.Title>Rename Document</Modal.Title>
          <Modal.Description>
            Update the document title used across the workspace.
          </Modal.Description>
        </div>
      </Modal.Header>

      <Modal.Body>
        <Input
          label="New Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
          error={error ?? undefined}
          autoFocus
          disabled={isSubmitting}
        />
      </Modal.Body>

      <Modal.Footer>
        <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={() => void handleSubmit()} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
