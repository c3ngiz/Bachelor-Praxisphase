import Card from "@/shared/components/ui/Card";
import { FilePlus } from "lucide-react";

type Props = {
  onCreate: () => void;
};

export default function CreateDocumentCard({ onCreate }: Props) {
  return (
    <Card
      interactive
      onClick={onCreate}
      className="group"
    >
      {/* PREVIEW AREA */}
      <div className="overflow-hidden rounded-t-xl">
        <div className="aspect-[3/4] bg-[#f1f3f4] p-3">
          <div className="flex h-full w-full items-center justify-center bg-white shadow-sm">

            {/* INNER AREA */}
            <div className="flex h-full w-full items-center justify-center border border-(--border)">
              <div className="flex flex-col items-center gap-4 text-center">

                {/* Icon */}
                <div
                  className="
                    flex h-12 w-12 items-center justify-center
                    rounded-full
                    bg-(--border)
                    text-(--fg-muted)
                  "
                >
                  <FilePlus size={20} />
                </div>

                {/* Title inside preview */}
                <div className="text-sm font-medium text-(--fg)">
                  New Document
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* FOOTER */}
      <Card.Content padding="sm">
        <div className="flex items-center gap-2 min-w-0">
          <FilePlus size={16} className="shrink-0 text-(--fg-muted)" />

          <div className="flex min-w-0 flex-col">
            <span className="text-sm font-medium truncate">
              Neues Dokument erstellen
            </span>

            <span className="text-xs text-(--fg-muted)">
              Klicken zum Erstellen
            </span>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}