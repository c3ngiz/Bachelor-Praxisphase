import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";

// import SignInPage from "@/features/auth/pages/SignInPage";
// import SignUpPage from "@/features/auth/pages/SignUpPage";
import DashboardPage from "@/features/documents/pages/DashboardPage";
// import EditorPage from "@/features/editor/pages/EditorPage";
import AppLayout from "@/shared/components/layout/AppLayout";

// function AuthLayout() {
//   return <Outlet />;
// }

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* <Route element={<AuthLayout />}>
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
        </Route> */}

        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          {/* <Route path="/document/:id" element={<EditorPage />} /> */}
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}