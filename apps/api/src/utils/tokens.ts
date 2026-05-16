import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type JwtUser = { sub: string; email: string };
export type PasswordResetToken = JwtUser & { purpose: "password_reset" };

export function signAccessToken(user: JwtUser) {
  return jwt.sign(user, env.JWT_SECRET, { expiresIn: "24h" });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as JwtUser;
}

export function signPasswordResetToken(user: JwtUser) {
  return jwt.sign({ ...user, purpose: "password_reset" } satisfies PasswordResetToken, env.JWT_SECRET, { expiresIn: "15m" });
}

export function verifyPasswordResetToken(token: string) {
  const payload = jwt.verify(token, env.JWT_SECRET) as PasswordResetToken;
  if (payload.purpose !== "password_reset") throw new Error("Invalid password reset token");
  return payload;
}
