import { useCallback, useMemo, useState } from "react"
import type { ReactNode } from "react"
import type { User } from "../types"
import { loginUser as loginUserRequest, registerUser as registerUserRequest } from "../services/authApi"
import { AuthContext } from "./AuthContext"

type Props = {
  children: ReactNode
}

type AuthState = {
  user: User | null
  token: string | null
}

export function AuthProvider({ children }: Props) {
  const [{ user, token }, setAuth] = useState<AuthState>({ user: null, token: null })
  const [isLoading, setIsLoading] = useState(false)

  const login = useCallback((nextToken: string, nextUser: User) => {
    setAuth({ token: nextToken, user: nextUser })
  }, [])

  const logout = useCallback(() => {
    setAuth({ token: null, user: null })
  }, [])

  const loginWithCredentials = useCallback(
    async (input: { email: string; password: string }) => {
      setIsLoading(true)

      try {
        const response = await loginUserRequest(input)
        login(response.token, response.user)
      } finally {
        setIsLoading(false)
      }
    },
    [login],
  )

  const registerWithCredentials = useCallback(
    async (input: { name: string; email: string; password: string; avatarColor?: string }) => {
      setIsLoading(true)

      try {
        const response = await registerUserRequest(input)
        login(response.token, response.user)
      } finally {
        setIsLoading(false)
      }
    },
    [login],
  )

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isLoading,
      login,
      loginWithCredentials,
      registerWithCredentials,
      logout,
    }),
    [isLoading, login, loginWithCredentials, logout, registerWithCredentials, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}