import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken, type JwtUser } from "../utils/tokens.js";

declare global {
  namespace Express {
    interface Request {
      user?: JwtUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) return res.status(401).json({ code: "UNAUTHENTICATED", message: "Missing bearer token" });
  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch {
    return res.status(401).json({ code: "UNAUTHENTICATED", message: "Invalid or expired token" });
  }
}
