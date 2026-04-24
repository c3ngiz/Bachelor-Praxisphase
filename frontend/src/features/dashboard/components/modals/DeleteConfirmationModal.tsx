import { useEffect, useMemo, useState } from "react";
import { Button, Input, Modal, Notice } from "@/shared/components/ui";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  documentTitle?: string;
  bulkCount?: number;
};

/**
 * DeleteConfirmationModal component.
 */
export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  documentTitle,
  bulkCount = 0,
}: Props) {
  const [confirmationText, setConfirmationText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isBulkDelete = bulkCount > 1;

  const expectedText = useMemo(() => {
    return documentTitle ?? "";
  }, [documentTitle]);

  useEffect(() => {
    if (isOpen) {
      setConfirmationText("");
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const isMatch = isBulkDelete ? true : confirmationText === expectedText;

  async function handleConfirm() {
    if (!isBulkDelete && !isMatch) {
      setError("Document name does not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirm();
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to delete document.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    if (isSubmitting) return;

    setConfirmationText("");
    setError(null);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <Modal.Header>
        <div>
          <Modal.Title>
            {isBulkDelete ? "Delete Documents" : "Delete Document"}
          </Modal.Title>
          <Modal.Description>
            Review the confirmation details before deleting.
          </Modal.Description>
        </div>
      </Modal.Header>

      <Modal.Body>
        <Notice variant="danger">
          <Notice.Description>
            This action <span className="font-semibold">cannot</span> be undone.
          </Notice.Description>
        </Notice>

        {isBulkDelete ? (
          <p className="text-sm text-(--fg)">
            Are you sure you want to permanently delete{" "}
            <span className="font-medium">{bulkCount} documents</span>?
          </p>
        ) : (
          <>
            <p className="text-sm text-(--fg)">
              To confirm, type{" "}
              <span className="rounded bg-(--bg) px-1 font-medium">
                {expectedText || "the document name"}
              </span>{" "}
              below.
            </p>

            <Input
              label="Document Name"
              value={confirmationText}
              onChange={(e) => {
                setConfirmationText(e.target.value);
                if (error) setError(null);
              }}
              error={error ?? undefined}
              autoFocus
              disabled={isSubmitting}
            />
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={() => void handleConfirm()}
          disabled={isSubmitting || !isMatch}
        >
          {isSubmitting ? "Deleting..." : "Delete"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
