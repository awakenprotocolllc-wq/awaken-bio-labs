/**
 * Edge-safe customer session check — no bcrypt, no Node crypto.
 * Used only by middleware. Full validation lives in customer-db.ts.
 */
import { kv } from "@vercel/kv";

type SessionRecord = { customerId: string; passwordVersion: number; ip?: string; ua?: string };
type AccountMeta   = { passwordVersion?: number };
type SessionContext = { ip: string; ua: string };

export async function verifyCustomerToken(
  token: string | undefined,
  context?: SessionContext
): Promise<boolean> {
  if (!token) return false;
  const record = await kv.get<SessionRecord>(`cust:session:${token}`);
  if (!record) return false;

  const account = await kv.get<AccountMeta>(`cust:${record.customerId}`);
  if (!account) return false;
  if ((account.passwordVersion ?? 0) !== record.passwordVersion) return false;

  if (context?.ua && record.ua && context.ua.slice(0, 200) !== record.ua) return false;

  return true;
}
