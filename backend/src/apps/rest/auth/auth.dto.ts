import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long.")
  .max(72, "Password must not exceed 72 characters.");

/** REST registration request body. */
export const restRegisterDto = z.object({
  email: z.string().email(),
  password: passwordSchema,
  name: z.string().trim().min(2).max(80),
  avatarColor: z.string().trim().min(1).max(64).default("bg-emerald-500"),
});

/** REST login request body. */
export const restLoginDto = z.object({
  email: z.string().email(),
  password: passwordSchema,
});

export type RestRegisterInput = z.infer<typeof restRegisterDto>;
export type RestLoginInput = z.infer<typeof restLoginDto>;

export type RestAuthUser = {
  id: string;
  email: string;
  name: string;
  initials: string;
  avatarColor: string;
  createdAt: string;
  updatedAt: string;
};

export type RestAuthResponse = {
  token: string;
  user: RestAuthUser;
};
