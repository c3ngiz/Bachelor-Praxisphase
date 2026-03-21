import type { Document } from "../types/document.types";
import { useDashboardStore } from "../store/dashboardStore";
import Card from "@/shared/components/ui/Card";
import Popover from "@/shared/components/ui/Popover";

import { generateDocumentPreview } from "../utils/generateDocumentPreview";
import { MoreVertical, FileText, Pencil, Trash, ExternalLink } from "lucide-react";
import DocumentCardPreview from "./DocumentCardPreview";

type Props = {
    document: Document;
    onOpen?: (id: string) => void;
    onRename?: (id: string) => void;
    onDelete?: (id: string) => void;
};

function formatDate(date: string) {
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

    const selectedCount = useDashboardStore((s) => s.selectedDocuments.size);
    const isSelectionMode = selectedCount > 0;

    const isSelected = selectedDocuments.has(document.id);

    const previewLines = generateDocumentPreview(document.content);

    return (
        <Card
            selectable
            selected={isSelected}
            interactive
            onClick={() => onOpen?.(document.id)}
            className="overflow-hidden"
        >
            {/* CHECKBOX */}
            <Card.Actions className="left-2 right-auto">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                        e.stopPropagation();
                        toggleSelection(document.id);
                    }}
                    className="h-4 w-4 cursor-pointer accent-(--accent)"
                />
            </Card.Actions>

            {/* MENU */}
            {!isSelectionMode && (
                <Card.Actions>
                    <Popover
                        align="right"
                        offset={8}
                        trigger={({ toggle }) => (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggle();
                                }}
                                className="rounded-md p-1 hover:bg-(--bg)"
                            >
                                <MoreVertical size={16} />
                            </button>
                        )}
                    >
                        {({ close }) => (
                            <div className="w-48 py-1">
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
                </Card.Actions>
            )}

            {/* 📄 REAL PAGE PREVIEW */}
            <DocumentCardPreview document={document} />

            {/* FOOTER */}
            <Card.Content padding="sm">
                <div className="flex items-center gap-2 min-w-0">
                    <FileText size={16} className="text-blue-500 shrink-0" />

                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium truncate">
                            {document.title}
                        </span>

                        <span className="text-xs text-(--fg-muted)">
                            Geöffnet {formatDate(document.updatedAt)}
                        </span>
                    </div>
                </div>
            </Card.Content>
        </Card>
    );
}