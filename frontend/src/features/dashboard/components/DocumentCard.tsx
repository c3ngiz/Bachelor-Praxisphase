import { useState } from "react";
import type { Document } from "../types/document.types";
import { useDashboardStore } from "../store/dashboardStore";
import Card from "@/shared/components/ui/Card";
import Popover from "@/shared/components/ui/Popover";
import {
    MoreVertical,
    FileText,
    Pencil,
    Trash,
    ExternalLink,
    FolderOpen,
} from "lucide-react";
import DocumentCardPreview from "./DocumentCardPreview";

type Props = {
    document: Document;
    onOpen?: (id: string) => void;
    onRename?: (id: string) => void;
    onDelete?: (id: string) => void;
};

function formatDate(date?: string) {
    if (!date) return "";
    return new Date(date).toLocaleDateString();
}

export default function DocumentCard({
    document,
    onOpen,
    onRename,
    onDelete,
}: Props) {
    const selectedDocuments = useDashboardStore((s) => s.selectedDocuments);
    const toggleSelection = useDashboardStore((s) => s.toggleSelection);

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const isSelected = selectedDocuments.has(document.id);
    const openedDate = formatDate(document.lastOpenedAt ?? document.updatedAt);

    return (
        <Card
            selectable
            selected={isSelected}
            interactive
            onClick={() => toggleSelection(document.id)}
            onDoubleClick={() => onOpen?.(document.id)}
            onMouseLeave={() => setIsMenuOpen(false)}
            className="group relative z-0 hover:z-20 focus-within:z-20"
        >
            <div className="overflow-hidden rounded-t-xl">
                <DocumentCardPreview document={document} />
            </div>

            <Card.Content padding="sm">
                <div className="flex items-center justify-between gap-3 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                        <FileText size={16} className="shrink-0 text-blue-500" />

                        <div className="flex min-w-0 flex-col">
                            <span className="truncate text-sm font-medium">
                                {document.title}
                            </span>

                            <span className="text-xs text-(--fg-muted)">
                                Geöffnet {openedDate}
                            </span>
                        </div>
                    </div>

                    <Popover
                        align="right"
                        offset={8}
                        open={isMenuOpen}
                        onOpenChange={setIsMenuOpen}
                        trigger={({ toggle, open }) => (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggle();
                                }}
                                className={[
                                    "shrink-0 rounded-md p-1 text-(--fg-muted)",
                                    open ? "bg-(--bg)" : "hover:bg-(--bg)",
                                ].join(" ")}
                                aria-label={`Open menu for ${document.title}`}
                                aria-expanded={open}
                            >
                                <MoreVertical size={16} />
                            </button>
                        )}
                    >
                        {({ close }) => (
                            <div className="w-48 py-1">
                                <button
                                    onClick={() => {
                                        onOpen?.(document.id);
                                        close();
                                    }}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-(--bg)"
                                >
                                    <FolderOpen size={14} />
                                    Öffnen
                                </button>

                                <button
                                    onClick={() => {
                                        onRename?.(document.id);
                                        close();
                                    }}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-(--bg)"
                                >
                                    <Pencil size={14} />
                                    Umbenennen
                                </button>

                                <button
                                    onClick={() => {
                                        onDelete?.(document.id);
                                        close();
                                    }}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-(--bg)"
                                >
                                    <Trash size={14} />
                                    Entfernen
                                </button>

                                <button
                                    onClick={() => {
                                        window.open(`/document/${document.id}`, "_blank");
                                        close();
                                    }}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-(--bg)"
                                >
                                    <ExternalLink size={14} />
                                    In neuem Tab öffnen
                                </button>
                            </div>
                        )}
                    </Popover>
                </div>
            </Card.Content>
        </Card>
    );
}