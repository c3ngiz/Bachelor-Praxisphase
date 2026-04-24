import { useState } from "react";
import { Button, Input, Modal } from "@/shared/components/ui";

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
    <Modal isOpen={isOpen} onClose={handleClose}>
      <Modal.Header>
        <div>
          <Modal.Title>Create Document</Modal.Title>
          <Modal.Description>
            Start a new document in your workspace.
          </Modal.Description>
        </div>
      </Modal.Header>

      <Modal.Body>
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
      </Modal.Body>

      <Modal.Footer>
        <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={() => void handleSubmit()} disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
