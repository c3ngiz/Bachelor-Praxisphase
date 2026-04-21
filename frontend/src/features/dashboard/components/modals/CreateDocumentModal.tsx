import { useState } from "react";
import { Modal, Input, Button } from "@/shared/components/ui";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void> | void;
};

/**
 * CreateDocumentModal component.
 */
export default function CreateDocumentModal({ isOpen, onClose, onCreate }: Props) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) {
      setError("Document name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreate(name.trim());
      setName("");
      setError(null);
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to create document.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    if (isSubmitting) return;

    setName("");
    setError(null);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Document">
      <Input
        label="Document Name"
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
          {isSubmitting ? "Creating..." : "Create"}
        </Button>
      </div>
    </Modal>
  );
}
