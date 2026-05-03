import { FileText } from "lucide-react";

import { Badge } from "@/shared/components/ui";

type Props = {
  title: string;
  isSaving?: boolean;
  lastSavedAt?: string | null;
  revision?: number;
  canEdit: boolean;
  onTitleChange: (value: string) => void;
};

function formatSavedLabel(lastSavedAt?: string | null): string {
  if (!lastSavedAt) {
    return "Not saved yet";
  }

  return `Saved ${new Date(lastSavedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export default function EditorDocumentTitle({
  title,
  isSaving = false,
  lastSavedAt,
  revision,
  canEdit,
  onTitleChange,
}: Props) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/8 text-[#AEAFCA] ring-1 ring-white/12 sm:inline-flex">
        <FileText size={18} />
      </span>

      <div className="min-w-0 flex-1">
        <input
          aria-label="Document title"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          readOnly={!canEdit}
          className="h-10 w-full rounded-md border border-transparent bg-transparent px-2 text-base font-semibold text-white outline-none transition-[background-color,border-color] placeholder:text-white/45 read-only:cursor-default read-only:text-white/78 hover:bg-white/6 focus:border-white/18 focus:bg-white/8 read-only:hover:bg-transparent read-only:focus:border-transparent read-only:focus:bg-transparent sm:text-lg"
        />
      </div>

      <div className="hidden shrink-0 items-center gap-2 md:flex">
        <Badge
          variant="subtle"
          size="md"
          className="bg-white/10 text-white/72"
        >
          {isSaving ? "Saving..." : formatSavedLabel(lastSavedAt)}
        </Badge>

        {revision ? (
          <Badge variant="subtle" size="md" className="bg-white/10 text-white/72">
            Rev {revision}
          </Badge>
        ) : null}
      </div>
    </div>
  );
}
