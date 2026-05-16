import crypto from "node:crypto";
import { env } from "../config/env.js";

const ALGORITHM = "aes-256-gcm";

function keyBuffer() {
  const raw = env.GEMINI_API_KEY_ENCRYPTION_KEY;
  const decoded = Buffer.from(raw, "base64");
  if (decoded.length === 32) return decoded;
  return crypto.createHash("sha256").update(raw).digest();
}

export function encryptSecret(plaintext: string) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    encryptedKey: encrypted.toString("hex"),
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex")
  };
}

export function decryptSecret(payload: { encryptedKey: string; iv: string; authTag: string }) {
  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer(), Buffer.from(payload.iv, "hex"));
  decipher.setAuthTag(Buffer.from(payload.authTag, "hex"));
  return Buffer.concat([
    decipher.update(Buffer.from(payload.encryptedKey, "hex")),
    decipher.final()
  ]).toString("utf8");
}
