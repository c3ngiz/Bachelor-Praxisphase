import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import Input from "@/shared/components/ui/Input"
import Button from "@/shared/components/ui/Button"

import AuthForm from "../components/AuthForm"
import { useAuth } from "../hooks/useAuth"

export default function SignInPage() {
  const navigate = useNavigate()
  const { login, loading } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await login({ email, password })
    navigate("/dashboard")
  }

  return (
    <AuthForm title="Sign In">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <p className="text-center text-sm text-[var(--fg-muted)]">
        Don't have an account?{" "}
        <Link to="/signup" className="text-[var(--accent)] hover:text-[var(--accent-hover)]">
          Sign up
        </Link>
      </p>
    </AuthForm>
  )
}