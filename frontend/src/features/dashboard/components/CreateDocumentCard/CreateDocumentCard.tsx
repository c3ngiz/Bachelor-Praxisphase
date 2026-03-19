import Button from "@/shared/components/ui/Button";

type Props = {
  onCreate: () => void;
};

export default function CreateDocumentCard({ onCreate }: Props) {
  return (
    <div
      onClick={onCreate}
      className="
        flex min-h-[260px] flex-col items-center justify-center
        gap-4
        rounded-xl
        border-2 border-dashed border-(--border)
        bg-(--bg-elevated)
        p-6
        text-center
        cursor-pointer
        transition-colors
        hover:border-(--accent)
        hover:bg-(--bg)
      "
    >
      <div
        className="
          flex h-12 w-12 items-center justify-center
          rounded-full
          bg-(--border)
          text-2xl
          font-medium
          text-(--fg-muted)
        "
        aria-hidden="true"
      >
        +
      </div>

      <div className="space-y-1">
        <div className="text-base font-semibold text-(--fg)">
          New Document
        </div>
        <p className="text-sm text-(--fg-muted)">
          Create a new document and start writing.
        </p>
      </div>

      <Button
        variant="ghost"
        className="px-3 py-1 text-xs"
        onClick={(event) => {
          event.stopPropagation();
          onCreate();
        }}
      >
        Create
      </Button>
    </div>
  );
}