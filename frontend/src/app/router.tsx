import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import AuthLayout from "@/shared/components/layout/AuthLayout"
import AppLayout from "@/shared/components/layout/AppLayout"

import SignInPage from "@/features/auth/pages/SignInPage"
import SignUpPage from "@/features/auth/pages/SignUpPage"
import DashboardPage from "@/features/documents/pages/DashboardPage"
import EditorPage from "@/features/editor/pages/EditorPage"

import ProtectedRoute from "@/features/auth/components/ProtectedRoute"

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/" element={<Navigate to="/signin" />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
        </Route>

        {/* App Routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>

        <Route path="/document/:id" element={<EditorPage />} />

      </Routes>
    </BrowserRouter>
  )
}