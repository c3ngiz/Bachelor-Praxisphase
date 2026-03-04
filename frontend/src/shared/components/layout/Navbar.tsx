import { Link } from "react-router-dom"
import useAuthContext from "@/features/auth/hooks/useAuthContext"
import Button from "@/shared/components/ui/Button"

export default function Navbar() {
  const { logout } = useAuthContext()

  return (
    <header className="border-b border-(--border) bg-(--bg-elevated)">
      <nav className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <Link
          to="/dashboard"
          className="text-lg font-semibold text-(--fg) transition-colors hover:text-(--accent-hover)"
        >
          CollabDocs
        </Link>

        <Button variant="ghost" onClick={logout} className="text-sm">
          Logout
        </Button>
      </nav>
  </header>
  )
}