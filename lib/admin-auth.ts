import { kv } from "@vercel/kv";
import { randomBytes } from "crypto";

const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days

type AdminSessionData = { ip?: string; ua?: string };
type SessionContext = { ip: string; ua: string };

/** Creates a new per-login admin session in KV. Returns the session token. */
export async function createAdminSession(context?: SessionContext): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const data: AdminSessionData = context
    ? { ip: context.ip, ua: context.ua.slice(0, 200) }
    : {};
  await kv.set(`admin:session:${token}`, data, { ex: SESSION_TTL });
  return token;
}

/**
 * Returns true if the token exists and is valid in KV.
 * Optional context checks user-agent binding; IP changes are logged only.
 */
export async function validateAdminSession(
  token: string | undefined,
  context?: SessionContext
): Promise<boolean> {
  if (!token) return false;
  // Legacy sessions stored as `true`; new sessions stored as AdminSessionData object
  const stored = await kv.get<AdminSessionData | boolean>(`admin:session:${token}`);
  if (!stored) return false;
  if (stored === true) return true; // legacy — no binding data

  if (context) {
    if (stored.ua && context.ua.slice(0, 200) !== stored.ua) {
      console.warn("[admin-session] UA mismatch — rejecting");
      return false;
    }
    if (stored.ip && context.ip !== stored.ip) {
      console.log(`[admin-session] IP change: ${stored.ip} → ${context.ip}`);
    }
  }

  return true;
}

/** Deletes the session from KV, immediately invalidating it. */
export async function deleteAdminSession(token: string): Promise<void> {
  await kv.del(`admin:session:${token}`);
}
