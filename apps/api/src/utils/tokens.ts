import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type JwtUser = { sub: string; email: string };

export function signAccessToken(user: JwtUser) {
  return jwt.sign(user, env.JWT_SECRET, { expiresIn: "24h" });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as JwtUser;
}
