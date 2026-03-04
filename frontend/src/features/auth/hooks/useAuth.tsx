import { useState } from "react"
import { signIn, signUp } from "../api/authApi"
import type { AuthCredentials, SignUpCredentials } from "../types"

export function useAuth() {
  const [loading, setLoading] = useState(false)

  async function login(data: AuthCredentials) {
    setLoading(true)

    const result = await signIn(data)

    setLoading(false)

    return result
  }

  async function register(data: SignUpCredentials) {
    setLoading(true)

    const result = await signUp(data)

    setLoading(false)

    return result
  }

  return {
    login,
    register,
    loading
  }
}