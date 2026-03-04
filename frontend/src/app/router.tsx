import { BrowserRouter, Routes, Route } from "react-router-dom";

import SignInPage from "@/features/auth/pages/SignInPage";
import SignUpPage from "@/features/auth/pages/SignUpPage";
import DashboardPage from "@/features/documents/pages/DashboardPage";
import EditorPage from "@/features/editor/pages/EditorPage";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/document/:id" element={<EditorPage />} />
      </Routes>
    </BrowserRouter>
  );
}