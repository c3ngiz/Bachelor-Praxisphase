import Button from "@/shared/components/ui/Button"
import { useNavigate } from "react-router-dom"

type Props = {
    title: string
    onTitleChange: (value: string) => void
}

export default function EditorToolbar({ title, onTitleChange }: Props) {
    const navigate = useNavigate()

    return (
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-3 bg-[var(--bg-elevated)]">

            <input
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                className="text-lg font-semibold bg-transparent outline-none"
            />

            <Button variant="secondary" onClick={() => navigate("/dashboard")}>
                Back
            </Button>

        </div>
    )
}