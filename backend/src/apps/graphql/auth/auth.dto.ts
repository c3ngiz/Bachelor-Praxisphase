import { z } from "zod";

const graphqlPasswordDto = z
  .string()
  .min(8, "Password must be at least 8 characters long.")
  .max(72, "Password must not exceed 72 characters.");

/** GraphQL register mutation input validator. */
export const graphqlRegisterDto = z.object({
  email: z.string().email(),
  password: graphqlPasswordDto,
  name: z.string().trim().min(2).max(80),
  avatarColor: z.string().trim().min(1).max(64).default("bg-emerald-500"),
});

/** GraphQL login mutation input validator. */
export const graphqlLoginDto = z.object({
  email: z.string().email(),
  password: graphqlPasswordDto,
});

export type GraphqlRegisterInput = z.infer<typeof graphqlRegisterDto>;
export type GraphqlLoginInput = z.infer<typeof graphqlLoginDto>;

export type GraphqlAuthUser = {
  id: string;
  email: string;
  name: string;
  initials: string;
  avatarColor: string;
  createdAt: string;
  updatedAt: string;
};

export type GraphqlAuthPayload = {
  token: string;
  user: GraphqlAuthUser;
};
