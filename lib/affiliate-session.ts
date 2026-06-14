/**
 * Edge-safe affiliate session check — no bcrypt, no Node crypto.
 * Used only by middleware. Full validation lives in affiliate-db.ts.
 */
import { kv } from "@vercel/kv";

type SessionRecord = { affiliateId: string; passwordVersion: number; ua?: string; ip?: string };
type AccountMeta   = { status: string; passwordVersion?: number };
type SessionContext = { ip: string; ua: string };

export async function verifyAffiliateToken(
  token: string | undefined,
  context?: SessionContext
): Promise<boolean> {
  if (!token) return false;
  const raw = await kv.get<SessionRecord | string>(`aff:session:${token}`);
  if (!raw) return false;

  let affiliateId: string;
  let sessionPasswordVersion: number;
  let sessionUa: string | undefined;

  if (typeof raw === "string") {
    affiliateId = raw;
    sessionPasswordVersion = 0;
  } else {
    affiliateId = raw.affiliateId;
    sessionPasswordVersion = raw.passwordVersion;
    sessionUa = raw.ua;
  }

  const account = await kv.get<AccountMeta>(`aff:account:${affiliateId}`);
  if (!account || account.status !== "active") return false;
  if ((account.passwordVersion ?? 0) !== sessionPasswordVersion) return false;

  if (context?.ua && sessionUa && context.ua.slice(0, 200) !== sessionUa) return false;

  return true;
}
