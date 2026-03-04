import type { AuthCredentials, SignUpCredentials } from "../types"

export async function signIn(data: AuthCredentials) {
  console.log("Sign in request", data)

  await new Promise((r) => setTimeout(r, 500))

  return {
    token: "mock-token",
    user: {
      id: "1",
      email: data.email
    }
  }
}

export async function signUp(data: SignUpCredentials) {
  console.log("Sign up request", data)

  await new Promise((r) => setTimeout(r, 500))

  return {
    token: "mock-token",
    user: {
      id: "1",
      email: data.email
    }
  }
}