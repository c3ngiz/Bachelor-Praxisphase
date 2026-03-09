type Props = {
    content: string
    onChange: (value: string) => void
}

export default function EditorArea({ content, onChange }: Props) {
    return (
        <textarea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Start writing..."
            className="w-full h-full resize-none outline-none text-[var(--fg)] bg-transparent"
        />
    )
}