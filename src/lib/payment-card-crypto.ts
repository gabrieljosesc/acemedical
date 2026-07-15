import crypto from "crypto";

// Server-only. Encrypts card fields at rest for manual/admin processing —
// Ace Medical never runs a live charge through the app; the CSR team
// processes payment out-of-band once an order is approved, matching the
// site's own "net-30 terms" / trade-account messaging.
const ALGO = "aes-256-gcm";
const SALT = "acemedical-card-salt-v1";

function getKey(): Buffer {
  const secret = process.env.PAYMENT_CARD_SECRET;
  if (!secret) throw new Error("PAYMENT_CARD_SECRET is not set");
  return crypto.scryptSync(secret, SALT, 32);
}

export function encryptCardField(value: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, encrypted].map((b) => b.toString("base64")).join(".");
}

export function decryptCardField(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(".");
  const key = getKey();
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
