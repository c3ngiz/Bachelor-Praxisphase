import bcrypt from "bcryptjs";
import { env } from "../config/env.js";

/** Hashes a plain-text password using the configured bcrypt cost. */
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
}

/** Compares a plain-text password with a stored bcrypt hash. */
export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
