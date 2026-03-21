import { useRecentDocuments } from "../../hooks/useRecentDocuments";
import Divider from "@/shared/components/ui/Divider";
import Button from "@/shared/components/ui/Button";

type Props = {
    onOpenDocument?: (documentId: string) => void;
};

export default function RecentDocuments({ onOpenDocument }: Props) {
    const recentDocuments = useRecentDocuments();

    if (recentDocuments.length === 0) {
        return null;
    }

    return (
        <div>
            <div className="flex flex-wrap gap-3">
                {recentDocuments.map((doc) => (
                    <Button
                        key={doc.id}
                        variant="secondary"
                        className="max-w-55 truncate"
                        onClick={() => onOpenDocument?.(doc.id)}
                    >
                        {doc.title}
                    </Button>
                ))}
            </div>

            <Divider className="mt-6" />
        </div>
    );
}