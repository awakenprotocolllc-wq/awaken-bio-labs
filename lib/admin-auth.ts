import { kv } from "@vercel/kv";
import { randomBytes } from "crypto";

const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days

/** Creates a new per-login admin session in KV. Returns the session token. */
export async function createAdminSession(): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await kv.set(`admin:session:${token}`, true, { ex: SESSION_TTL });
  return token;
}

/** Returns true if the token exists and is valid in KV. */
export async function validateAdminSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const valid = await kv.get(`admin:session:${token}`);
  return valid === true;
}

/** Deletes the session from KV, immediately invalidating it. */
export async function deleteAdminSession(token: string): Promise<void> {
  await kv.del(`admin:session:${token}`);
}
