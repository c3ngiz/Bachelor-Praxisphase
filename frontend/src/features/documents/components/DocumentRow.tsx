import { useNavigate } from "react-router-dom"
import type { Document } from "../types"

type Props = {
    document: Document
}

export default function DocumentRow({ document }: Props) {
    const navigate = useNavigate()

    return (
        <tr
            className="cursor-pointer border-b border-(--border) transition-colors hover:bg-(--bg-elevated)"
            onClick={() => navigate(`/document/${document.id}`)}
        >
            <td className="px-4 py-3 font-medium text-(--fg)">{document.title}</td>

            <td className="px-4 py-3 text-sm text-(--fg-muted)">
                {document.updatedAt}
            </td>
        </tr>
    )
}