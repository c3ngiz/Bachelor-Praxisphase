import { useEditorSessionStore } from "../store/editorSessionStore";

export default function PresenceBar() {
    const collaboratorsConnected = useEditorSessionStore(
        (s) => s.collaboratorsConnected,
    );

    const label =
        collaboratorsConnected > 0
            ? `${collaboratorsConnected} collaborator${collaboratorsConnected > 1 ? "s" : ""} connected`
            : "No collaborators connected";

    return (
        <div className="border-t border-(--border) px-6 py-2 text-sm text-(--fg-muted)">
            {label}
        </div>
    )
}