import Button from "@/shared/components/ui/Button"

type Props = {
    onCreate: () => void
}

export default function DocumentsEmptyState({ onCreate }: Props) {
    return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-(--border) border-dashed py-20 text-center">
            <p className="mb-3 text-(--fg-muted)">
                You don't have any documents yet.
            </p>

            <Button onClick={onCreate}>
                Create your first document
            </Button>
        </div>
    )
}