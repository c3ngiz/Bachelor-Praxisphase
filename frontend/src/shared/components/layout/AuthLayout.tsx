import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-(--bg) text-(--fg)">
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}