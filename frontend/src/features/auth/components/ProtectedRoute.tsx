import { Navigate, useLocation } from "react-router-dom"
import type { ReactNode } from "react"
import useAuth from "../hooks/useAuth"

type Props = {
  children: ReactNode
}

export default function ProtectedRoute({ children }: Props) {
  const { token, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return null
  }

  if (!token) {
    return <Navigate to="/signin" replace state={{ from: location }} />
  }

  return <>{children}</>
}