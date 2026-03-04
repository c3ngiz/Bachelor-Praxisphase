import { useState } from "react"
import { signIn, signUp } from "../api/authApi"
import useAuthContext from "./useAuthContext"
import type { AuthCredentials, SignUpCredentials } from "../types"

export default function useAuth() {
  const [loading, setLoading] = useState(false)

  const { login } = useAuthContext()

  async function loginUser(data: AuthCredentials) {
    setLoading(true)

    const result = await signIn(data)

    login(result.token, result.user)

    setLoading(false)
  }

  async function registerUser(data: SignUpCredentials) {
    setLoading(true)

    const result = await signUp(data)

    login(result.token, result.user)

    setLoading(false)
  }

  return {
    loginUser,
    registerUser,
    loading
  }
}