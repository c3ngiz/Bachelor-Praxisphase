import { Button } from "@/shared/components/ui";

type Props = {
  count: number;
  onClear: () => void;
  onDelete: () => void;
  canDelete?: boolean;
};

/**
 * MultiSelectToolbar component.
 */
export default function MultiSelectToolbar({
  count,
  onClear,
  onDelete,
  canDelete = true,
}: Props) {
  return (
    <div
      className="
        fixed bottom-4 left-1/2 z-50 -translate-x-1/2
        flex items-center gap-4
        rounded-xl border border-(--border)
        bg-(--bg-elevated)
        px-4 py-3 shadow-lg
      "
    >
      <span className="text-sm text-(--fg)">
        <span className="font-semibold">{count}</span> selected
      </span>

      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={onClear}>
          Clear
        </Button>

        <Button variant="danger" onClick={onDelete} disabled={!canDelete}>
          Delete
        </Button>
      </div>
    </div>
  );
}
