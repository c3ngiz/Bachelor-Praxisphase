import { useNavigate } from "react-router-dom"
import { FileText } from "lucide-react"

type Props = {
    title: string
    isSaving?: boolean
    lastSavedAt?: string | null
    onTitleChange: (value: string) => void
}

export default function EditorTitleBar({
    title,
    isSaving = false,
    lastSavedAt,
    onTitleChange,
}: Props) {
    const navigate = useNavigate()

    const saveLabel = isSaving
        ? "Saving..."
        : lastSavedAt
            ? `Saved ${new Date(lastSavedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            })}`
            : "";

    return (
        <div className="flex items-center justify-between border-b border-(--border) bg-(--bg-elevated) px-6 py-3">

            <div className="flex items-center gap-3">

                <FileText size={22} className="text-emerald-500" />

                <input
                    value={title}
                    onChange={(e) => onTitleChange(e.target.value)}
                    className="text-lg font-semibold bg-transparent outline-none"
                />

                {saveLabel ? (
                    <span className="text-xs text-(--fg-muted)">{saveLabel}</span>
                ) : null}

            </div>

            <button
                onClick={() => navigate("/dashboard")}
                className="rounded-md border px-3 py-1 text-sm hover:bg-gray-100"
            >
                Back
            </button>

        </div>
    )
}