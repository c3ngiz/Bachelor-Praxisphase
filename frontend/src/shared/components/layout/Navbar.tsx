import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="h-14 border-b flex items-center justify-between px-6 bg-white">
      <Link
        to="/dashboard"
        className="font-bold text-lg"
      >
        CollabDocs
      </Link>

      <div className="flex gap-6 text-sm">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/profile">Profile</Link>
      </div>
    </nav>
  );
}