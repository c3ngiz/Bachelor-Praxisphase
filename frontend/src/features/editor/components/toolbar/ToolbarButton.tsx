import type { ReactNode } from "react"

type Props = {
    onClick: () => void
    children: ReactNode
}

export default function ToolbarButton({ onClick, children }: Props) {
    return (
        <button
            onClick={onClick}
            className="toolbar-btn"
            type="button"
        >
            {children}
        </button>
    )
}