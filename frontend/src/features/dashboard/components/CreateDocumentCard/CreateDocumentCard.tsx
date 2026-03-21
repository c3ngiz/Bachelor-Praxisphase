import Button from "@/shared/components/ui/Button";
import Card from "@/shared/components/ui/Card";

type Props = {
  onCreate: () => void;
};

export default function CreateDocumentCard({ onCreate }: Props) {
  return (
    <Card
      variant="outline"
      interactive
      onClick={onCreate}
      className="
        min-h-65
        border-2 border-dashed
        items-center justify-center text-center
        hover:border-(--accent)
        hover:bg-(--bg)
      "
    >
      {/* CONTENT */}
      <Card.Content
        padding="lg"
        className="items-center justify-center text-center gap-4"
      >
        {/* Icon */}
        <div
          className="
            flex h-12 w-12 items-center justify-center
            rounded-full
            bg-(--border)
            text-2xl
            font-medium
            text-(--fg-muted)
          "
        >
          +
        </div>

        {/* Text */}
        <div className="space-y-1">
          <div className="text-base font-semibold text-(--fg)">
            New Document
          </div>
          <p className="text-sm text-(--fg-muted)">
            Create a new document and start writing.
          </p>
        </div>
      </Card.Content>

      {/* FOOTER */}
      <Card.Footer
        padding="sm"
        className="flex justify-center border-none pt-0"
      >
        <Button
          variant="primary"
          className="px-3 py-1 text-xs"
          onClick={(event) => {
            event.stopPropagation();
            onCreate();
          }}
        >
          Create
        </Button>
      </Card.Footer>
    </Card>
  );
}