import { Navigate, useLocation } from "react-router-dom"
import type { ReactNode } from "react"
import useAuthContext from "../hooks/useAuthContext"

type Props = {
  children: ReactNode
}

export default function ProtectedRoute({ children }: Props) {
  const { token } = useAuthContext()
  const location = useLocation()

  if (!token) {
    return <Navigate to="/signin" replace state={{ from: location }} />
  }

  return <>{children}</>
}