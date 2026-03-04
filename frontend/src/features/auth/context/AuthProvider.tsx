import { useState } from "react"
import type { ReactNode } from "react"
import type { User } from "../types"
import { AuthContext } from "./AuthContext"

type Props = {
  children: ReactNode
}

type AuthState = {
  user: User | null
  token: string | null
}

function getInitialAuthState(): AuthState {
  if (typeof window === "undefined") {
    return { user: null, token: null }
  }

  const storedToken = localStorage.getItem("token")
  const storedUser = localStorage.getItem("user")

  if (!storedToken || !storedUser) {
    return { user: null, token: null }
  }

  try {
    return {
      token: storedToken,
      user: JSON.parse(storedUser) as User,
    }
  } catch {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    return { user: null, token: null }
  }
}

export function AuthProvider({ children }: Props) {
  const [{ user, token }, setAuth] = useState<AuthState>(getInitialAuthState)

  function login(nextToken: string, nextUser: User) {
    setAuth({ token: nextToken, user: nextUser })
    localStorage.setItem("token", nextToken)
    localStorage.setItem("user", JSON.stringify(nextUser))
  }

  function logout() {
    setAuth({ token: null, user: null })
    localStorage.removeItem("token")
    localStorage.removeItem("user")
  }

  return <AuthContext.Provider value={{ user, token, login, logout }}>{children}</AuthContext.Provider>
}