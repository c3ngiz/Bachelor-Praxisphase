import {
  Clock3,
  FileText,
  Inbox,
  PencilLine,
  Share2,
  Sparkles,
} from "lucide-react";

import type {
  DashboardCollection,
  DashboardCollectionId,
} from "../../utils/dashboardCollections";
import { cn } from "@/shared/lib/ui/cn";

type Props = {
  activeCollection: DashboardCollectionId;
  collections: DashboardCollection[];
  onSelectCollection: (collection: DashboardCollectionId) => void;
};

const collectionIcons: Record<DashboardCollectionId, typeof FileText> = {
  all: Inbox,
  shared: Share2,
  recent: Clock3,
  activity: PencilLine,
  empty: FileText,
};

/**
 * DashboardSidebar component.
 */
export default function DashboardSidebar({
  activeCollection,
  collections,
  onSelectCollection,
}: Props) {
  return (
    <aside
      className="
        w-full shrink-0 border-b border-(--border) bg-(--bg-subtle)
        px-4 py-4 md:w-60 md:border-b-0 md:border-r md:px-4 md:py-6
      "
    >
      <div className="mb-5 hidden px-3 md:block">
        <div className="text-xs font-bold uppercase text-(--fg-muted)">
          Workspace
        </div>
        <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-(--fg)">
          <Sparkles size={15} className="text-(--accent)" />
          Document hub
        </div>
      </div>

      <nav
        aria-label="Document collections"
        className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible"
      >
        {collections.map((collection) => {
          const Icon = collectionIcons[collection.id];

          return (
            <div key={collection.id} className="min-w-44 md:min-w-0">
              <button
                type="button"
                onClick={() => onSelectCollection(collection.id)}
                className={cn(
                  "flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition-[background-color,color,box-shadow]",
                  collection.id === activeCollection
                    ? "bg-(--accent) text-white shadow-[0_10px_24px_rgba(73,67,190,0.24)]"
                    : "text-(--fg-muted) hover:bg-white hover:text-(--fg)",
                )}
              >
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center">
                  <Icon size={16} />
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {collection.label}
                </span>
                <span
                  className={cn(
                    "inline-flex min-w-6 shrink-0 items-center justify-center rounded-md px-1.5 py-0.5 text-[11px] font-bold",
                    collection.id === activeCollection
                      ? "bg-white/18 text-white"
                      : "bg-white text-(--fg-muted)",
                  )}
                >
                  {collection.documents.length}
                </span>
              </button>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
