import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long.")
  .max(72, "Password must not exceed 72 characters.");

export const registerSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  name: z.string().trim().min(2).max(80),
  avatarColor: z.string().trim().min(1).max(64).default("bg-emerald-500"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
