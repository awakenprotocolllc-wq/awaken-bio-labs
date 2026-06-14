import { kv } from "@vercel/kv";
import { randomBytes } from "crypto";

const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days
const ROTATION_DAYS = 90;
const PASSWORD_META_KEY = "admin:password:meta";

type AdminSessionData = { ip?: string; ua?: string };
type SessionContext = { ip: string; ua: string };
type AdminPasswordMeta = { hash: string | null; changedAt: string };

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

// ── Password rotation ────────────────────────────────────────────────────────

/**
 * Returns the bcrypt hash to compare against. KV takes priority over env var
 * so that passwords changed via the admin panel take effect immediately.
 */
export async function getAdminPasswordHash(): Promise<string> {
  const meta = await kv.get<AdminPasswordMeta>(PASSWORD_META_KEY);
  if (meta?.hash) return meta.hash;
  return process.env.ADMIN_PASSWORD ?? "";
}

/**
 * Seeds the rotation clock on first login if no record exists yet.
 * Idempotent — does nothing if already initialized.
 */
export async function initAdminPasswordMeta(): Promise<void> {
  const existing = await kv.get<AdminPasswordMeta>(PASSWORD_META_KEY);
  if (!existing) {
    await kv.set(PASSWORD_META_KEY, { hash: null, changedAt: new Date().toISOString() });
  }
}

/**
 * Stores a new bcrypt hash and resets the 90-day rotation clock.
 * Called after the admin successfully changes their password.
 */
export async function rotateAdminPassword(newHash: string): Promise<void> {
  await kv.set(PASSWORD_META_KEY, { hash: newHash, changedAt: new Date().toISOString() });
}

/**
 * Returns true when the password has not been rotated within ROTATION_DAYS.
 * Returns false (not stale) when no rotation record exists — lets the admin
 * log in and initialize the clock before being locked out of payout data.
 */
export async function isAdminPasswordStale(): Promise<boolean> {
  const meta = await kv.get<AdminPasswordMeta>(PASSWORD_META_KEY);
  if (!meta) return false;
  const ms = Date.now() - new Date(meta.changedAt).getTime();
  return ms > ROTATION_DAYS * 24 * 60 * 60 * 1000;
}

/** Returns rotation status for the System page dashboard. */
export async function getPasswordRotationStatus(): Promise<{
  changedAt: string | null;
  daysRemaining: number;
  isStale: boolean;
}> {
  const meta = await kv.get<AdminPasswordMeta>(PASSWORD_META_KEY);
  if (!meta) return { changedAt: null, daysRemaining: ROTATION_DAYS, isStale: false };
  const daysSince = (Date.now() - new Date(meta.changedAt).getTime()) / (1000 * 60 * 60 * 24);
  const daysRemaining = Math.max(0, Math.floor(ROTATION_DAYS - daysSince));
  return { changedAt: meta.changedAt, daysRemaining, isStale: daysSince >= ROTATION_DAYS };
}
