import { useState } from "react";
import type { Document } from "@/features/documents";
import { useDashboardSelectionState } from "../../hooks/useDashboardSelectionState";
import { AvatarStack, Badge, Card, Menu } from "@/shared/components/ui";
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

function getVisibilityVariant(document: Document) {
    switch (document.visibility) {
        case "workspace":
            return "success";
        case "shared":
            return "info";
        default:
            return "subtle";
    }
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
    const { selectedDocuments, toggleSelection } = useDashboardSelectionState();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);

    const isSelected = selectedDocuments.has(document.id);
    const collaborators = document.collaborators ?? [];

    return (
        <>
            <Card
                selectable
                selected={isSelected}
                interactive
                onClick={() => toggleSelection(document.id)}
                onDoubleClick={() => onOpen?.(document.id)}
                onMouseLeave={() => setIsMenuOpen(false)}
                padding="none"
                shadow="none"
                className="
                    group relative z-0 bg-white/82
                    shadow-[0_14px_38px_rgba(68,71,95,0.10)]
                    hover:z-20 hover:shadow-[0_22px_48px_rgba(68,71,95,0.18)]
                    focus-within:z-20
                "
            >
                <div className="overflow-hidden">
                    <DocumentCardPreview document={document} />
                </div>

                <Card.Content padding="md" className="gap-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                            <FileText size={16} className="shrink-0 text-(--accent)" />

                            <div className="min-w-0">
                                <span className="block truncate text-sm font-bold text-[#030618]">
                                    {document.title}
                                </span>
                                <span className="block truncate text-xs text-(--fg-muted)">
                                    Edited by {document.lastEditedByName} · {formatEditedAt(document.lastEditedAt)}
                                </span>
                            </div>
                        </div>

                        <Menu.Root open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                            <Menu.Trigger>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                    }}
                                    className={[
                                        "shrink-0 rounded-lg p-1 text-(--fg-muted)",
                                        isMenuOpen ? "bg-(--bg)" : "hover:bg-(--bg)",
                                    ].join(" ")}
                                    aria-label={`Open menu for ${document.title}`}
                                >
                                    <MoreVertical size={16} />
                                </button>
                            </Menu.Trigger>

                            <Menu.Content className="w-48">
                                <Menu.Item
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onOpen?.(document.id);
                                    }}
                                >
                                    <FolderOpen size={14} />
                                    Open
                                </Menu.Item>

                                <Menu.Item
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onRename?.(document.id);
                                    }}
                                >
                                    <Pencil size={14} />
                                    Rename
                                </Menu.Item>

                                <Menu.Item
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setIsShareOpen(true);
                                    }}
                                >
                                    <Share2 size={14} />
                                    Share
                                </Menu.Item>

                                <Menu.Item
                                    danger
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onDelete?.(document.id);
                                    }}
                                >
                                    <Trash size={14} />
                                    Delete
                                </Menu.Item>

                                <Menu.Item
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        window.open(`/document/${document.id}`, "_blank");
                                    }}
                                >
                                    <ExternalLink size={14} />
                                    Open in new tab
                                </Menu.Item>
                            </Menu.Content>
                        </Menu.Root>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-(--border)/45 pt-3">
                        <div className="flex min-w-0 items-center gap-2">
                            <Badge variant={getVisibilityVariant(document)}>
                                {getVisibilityLabel(document)}
                            </Badge>

                            <span className="truncate text-xs text-(--fg-muted)">
                                {collaborators.length} collaborator{collaborators.length === 1 ? "" : "s"}
                            </span>
                        </div>

                        <AvatarStack
                            size="sm"
                            max={3}
                            items={collaborators.map((collaborator) => ({
                                id: collaborator.id,
                                name: `${collaborator.name} · ${collaborator.role}`,
                                initials: collaborator.initials,
                                colorClassName: collaborator.color,
                            }))}
                        />
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
