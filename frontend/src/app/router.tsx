import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import AuthLayout from "@/shared/components/layout/AuthLayout"

import {
  ProtectedRoute,
  SignInPage,
  SignUpPage,
} from "@/features/auth"
import { DashboardPage } from "@/features/dashboard"
import { EditorPage } from "@/features/editor"

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

        {/* Dashboard Route */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/document/:id"
          element={
            <ProtectedRoute>
              <EditorPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}