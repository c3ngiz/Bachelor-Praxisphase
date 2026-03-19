import { Modal, Button } from "@/shared/components/ui";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  documentTitle?: string;
};

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  documentTitle,
}: Props) {
  function handleConfirm() {
    onConfirm();
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Document">
      <div className="text-sm text-(--fg)">
        Are you sure you want to delete{" "}
        <span className="font-medium">
          {documentTitle || "this document"}
        </span>
        ?
      </div>

      <p className="text-xs text-(--fg-muted)">
        This action cannot be undone.
      </p>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={handleConfirm}
        >
          Delete
        </Button>
      </div>
    </Modal>
  );
}