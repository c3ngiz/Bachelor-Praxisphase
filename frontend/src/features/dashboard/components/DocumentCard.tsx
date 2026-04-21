import { useState } from "react";
import type { Document, DocumentCollaborator } from "@/features/documents";
import { useDashboardStore } from "../store/dashboardStore";
import Card from "@/shared/components/ui/Card";
import Popover from "@/shared/components/ui/Popover";
import {
    ExternalLink,
    FileText,
    FolderOpen,
    MoreVertical,
    Pencil,
    Share2,
    Trash,
} from "lucide-react";
import DocumentCardPreview from "./DocumentCardPreview";
import ShareDocumentModal from "./ShareDocumentModal";

type Props = {
    document: Document;
    onOpen?: (id: string) => void;
    onRename?: (id: string) => void;
    onDelete?: (id: string) => void;
};

function formatEditedAt(date?: string) {
    if (!date) return "";
    return new Date(date).toLocaleDateString();
}

function getVisibilityLabel(document: Document) {
    switch (document.visibility) {
        case "workspace":
            return "Team";
        case "shared":
            return "Shared";
        default:
            return "Private";
    }
}

function getVisibilityClasses(document: Document) {
    switch (document.visibility) {
        case "workspace":
            return "bg-emerald-100 text-emerald-700";
        case "shared":
            return "bg-sky-100 text-sky-700";
        default:
            return "bg-slate-100 text-slate-600";
    }
}

function getVisibleCollaborators(collaborators?: DocumentCollaborator[]) {
    return (collaborators ?? []).slice(0, 3);
}

/**
 * DocumentCard component.
 */
export default function DocumentCard({
    document,
    onOpen,
    onRename,
    onDelete,
}: Props) {
    const selectedDocuments = useDashboardStore((s) => s.selectedDocuments);
    const toggleSelection = useDashboardStore((s) => s.toggleSelection);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);

    const isSelected = selectedDocuments.has(document.id);
    const collaborators = document.collaborators ?? [];
    const visibleCollaborators = getVisibleCollaborators(collaborators);

    return (
        <>
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
                    <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                            <FileText size={16} className="shrink-0 text-emerald-500" />

                            <div className="min-w-0">
                                <span className="block truncate text-sm font-medium">
                                    {document.title}
                                </span>
                                <span className="block text-xs text-(--fg-muted)">
                                    Edited by {document.lastEditedByName} · {formatEditedAt(document.lastEditedAt)}
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
                                        Open
                                    </button>

                                    <button
                                        onClick={() => {
                                            onRename?.(document.id);
                                            close();
                                        }}
                                        className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-(--bg)"
                                    >
                                        <Pencil size={14} />
                                        Rename
                                    </button>

                                    <button
                                        onClick={() => {
                                            setIsShareOpen(true);
                                            close();
                                        }}
                                        className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-(--bg)"
                                    >
                                        <Share2 size={14} />
                                        Share
                                    </button>

                                    <button
                                        onClick={() => {
                                            onDelete?.(document.id);
                                            close();
                                        }}
                                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-(--bg)"
                                    >
                                        <Trash size={14} />
                                        Delete
                                    </button>

                                    <button
                                        onClick={() => {
                                            window.open(`/document/${document.id}`, "_blank");
                                            close();
                                        }}
                                        className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-(--bg)"
                                    >
                                        <ExternalLink size={14} />
                                        Open in new tab
                                    </button>
                                </div>
                            )}
                        </Popover>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span
                                className={[
                                    "rounded-md px-2 py-1 text-[11px] font-semibold",
                                    getVisibilityClasses(document),
                                ].join(" ")}
                            >
                                {getVisibilityLabel(document)}
                            </span>

                            <span className="text-xs text-(--fg-muted)">
                                {collaborators.length} collaborator{collaborators.length === 1 ? "" : "s"}
                            </span>
                        </div>

                        <div className="flex -space-x-2">
                            {visibleCollaborators.map((collaborator) => (
                                <div
                                    key={collaborator.id}
                                    title={`${collaborator.name} · ${collaborator.role}`}
                                    className={[
                                        "inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-(--bg-elevated) text-[10px] font-semibold text-white",
                                        collaborator.color,
                                    ].join(" ")}
                                >
                                    {collaborator.initials}
                                </div>
                            ))}

                            {collaborators.length > visibleCollaborators.length ? (
                                <div className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-(--bg-elevated) bg-slate-200 text-[10px] font-semibold text-slate-700">
                                    +{collaborators.length - visibleCollaborators.length}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </Card.Content>
            </Card>

            <ShareDocumentModal
                document={document}
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
            />
        </>
    );
}