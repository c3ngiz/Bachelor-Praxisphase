import { useEffect, useState } from "react";
import { Modal, Input, Button } from "@/shared/components/ui";

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
    <Modal isOpen={isOpen} onClose={handleClose} title="Rename Document">
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

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={() => void handleSubmit()} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </Modal>
  );
}
