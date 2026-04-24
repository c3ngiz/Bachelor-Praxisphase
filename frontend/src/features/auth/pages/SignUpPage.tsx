import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Button, Input } from "@/shared/components/ui"

import AuthForm from "../components/AuthForm"
import useAuth from "../hooks/useAuth"

export default function SignUpPage() {
  const navigate = useNavigate()
  const { registerWithCredentials, isLoading } = useAuth()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await registerWithCredentials({ name, email, password })
    navigate("/dashboard")
  }

  return (
    <AuthForm title="Create Account">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
        />

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

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Creating account..." : "Sign Up"}
        </Button>
      </form>

      <p className="text-center text-sm text-(--fg-muted)">
        Already have an account?{" "}
        <Link to="/signin" className="text-(--accent) hover:text-(--accent-hover)">
          Sign in
        </Link>
      </p>
    </AuthForm>
  )
}
