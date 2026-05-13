import { kv } from "@vercel/kv";
import { createHash, randomBytes } from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AffiliateApplication = {
  id: string;
  name: string;
  email: string;
  platform: string;
  audience?: string;
  about?: string;
  status: "pending" | "approved" | "denied";
  appliedAt: string;
};

export type AffiliateAccount = {
  id: string;
  name: string;
  email: string;
  affiliateCode: string;
  /** pending_contract = approved but contract not yet signed */
  status: "pending_contract" | "active" | "suspended";
  commissionRate: number; // 0.25 = 25%
  discountRate: number;   // 0.10 = 10% customer discount
  joinedAt: string;
  applicationId?: string;
  contractSignedAt?: string;
};

// Internal — never returned to client
type AffiliateAccountInternal = AffiliateAccount & { passwordHash: string };

export type ContractToken = {
  token: string;
  affiliateId: string;
  name: string;
  email: string;
  /** Plain-text password stored temporarily (7-day TTL) so it can be emailed after signing */
  password: string;
  createdAt: string;
  expiresAt: string;
  signed: boolean;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function genId(prefix = ""): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function hashPassword(password: string): string {
  return createHash("sha256")
    .update("awaken-biolabs:" + password)
    .digest("hex");
}

export function generateAffiliateCode(name: string): string {
  const clean = name.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return clean.slice(0, 8) || "PARTNER";
}

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------

export async function createApplication(
  data: Pick<AffiliateApplication, "name" | "email" | "platform" | "audience" | "about">
): Promise<AffiliateApplication> {
  const id = genId("app_");
  const app: AffiliateApplication = { ...data, id, status: "pending", appliedAt: new Date().toISOString() };
  await kv.set(`aff:application:${id}`, app);
  await kv.zadd("aff:applications", { score: Date.now(), member: id });
  return app;
}

export async function listApplications(): Promise<AffiliateApplication[]> {
  const ids = (await kv.zrange("aff:applications", 0, -1, { rev: true })) as string[];
  if (!ids.length) return [];
  const apps = await Promise.all(ids.map((id) => kv.get<AffiliateApplication>(`aff:application:${id}`)));
  return apps.filter(Boolean) as AffiliateApplication[];
}

export async function updateApplicationStatus(id: string, status: AffiliateApplication["status"]): Promise<void> {
  const app = await kv.get<AffiliateApplication>(`aff:application:${id}`);
  if (app) await kv.set(`aff:application:${id}`, { ...app, status });
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

export async function createAffiliateAccount(
  applicationId: string,
  name: string,
  email: string,
  password: string,
  affiliateCode: string,
  commissionRate = 0.25,
  discountRate = 0.10
): Promise<AffiliateAccount> {
  const id = genId("aff_");
  const account: AffiliateAccountInternal = {
    id,
    name,
    email: email.toLowerCase(),
    affiliateCode: affiliateCode.toUpperCase(),
    status: "pending_contract", // must sign contract before going active
    commissionRate,
    discountRate,
    joinedAt: new Date().toISOString(),
    applicationId,
    passwordHash: hashPassword(password),
  };
  await kv.set(`aff:account:${id}`, account);
  await kv.set(`aff:email:${email.toLowerCase()}`, id);
  await kv.set(`aff:code:${affiliateCode.toUpperCase()}`, id);
  await kv.zadd("aff:accounts", { score: Date.now(), member: id });

  const { passwordHash, ...safe } = account;
  return safe;
}

export async function listAffiliates(): Promise<AffiliateAccount[]> {
  const ids = (await kv.zrange("aff:accounts", 0, -1, { rev: true })) as string[];
  if (!ids.length) return [];
  const accounts = await Promise.all(ids.map((id) => kv.get<AffiliateAccountInternal>(`aff:account:${id}`)));
  return (accounts.filter(Boolean) as AffiliateAccountInternal[]).map(({ passwordHash, ...rest }) => rest);
}

export async function getAffiliateById(id: string): Promise<AffiliateAccount | null> {
  const account = await kv.get<AffiliateAccountInternal>(`aff:account:${id}`);
  if (!account) return null;
  const { passwordHash, ...safe } = account;
  return safe;
}

export async function getAffiliateByCode(code: string): Promise<AffiliateAccount | null> {
  const id = await kv.get<string>(`aff:code:${code.toUpperCase()}`);
  if (!id) return null;
  return getAffiliateById(id);
}

export async function updateAffiliateStatus(
  id: string,
  status: AffiliateAccount["status"],
  extra?: Partial<AffiliateAccount>
): Promise<void> {
  const account = await kv.get<AffiliateAccountInternal>(`aff:account:${id}`);
  if (account) await kv.set(`aff:account:${id}`, { ...account, ...extra, status });
}

// ---------------------------------------------------------------------------
// Contract signing
// ---------------------------------------------------------------------------

export async function createContractToken(
  affiliateId: string,
  name: string,
  email: string,
  password: string
): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const record: ContractToken = {
    token,
    affiliateId,
    name,
    email,
    password,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    signed: false,
  };
  await kv.set(`aff:contract:${token}`, record, { ex: 60 * 60 * 24 * 7 });
  return token;
}

export async function getContractToken(token: string): Promise<ContractToken | null> {
  return kv.get<ContractToken>(`aff:contract:${token}`);
}

export async function signContract(token: string): Promise<AffiliateAccount | null> {
  const record = await getContractToken(token);
  if (!record || record.signed) return null;
  if (new Date() > new Date(record.expiresAt)) return null;

  // Mark token as used
  await kv.set(`aff:contract:${token}`, { ...record, signed: true });

  // Activate the affiliate account
  await updateAffiliateStatus(record.affiliateId, "active", {
    contractSignedAt: new Date().toISOString(),
  });

  return getAffiliateById(record.affiliateId);
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function validateAffiliateLogin(email: string, password: string): Promise<AffiliateAccount | null> {
  const id = await kv.get<string>(`aff:email:${email.toLowerCase()}`);
  if (!id) return null;
  const account = await kv.get<AffiliateAccountInternal>(`aff:account:${id}`);
  if (!account || account.status !== "active") return null;
  if (account.passwordHash !== hashPassword(password)) return null;
  const { passwordHash, ...safe } = account;
  return safe;
}

export async function validateDiscountCode(code: string): Promise<{ valid: boolean; discountRate: number } > {
  const affiliate = await getAffiliateByCode(code);
  if (!affiliate || affiliate.status !== "active") return { valid: false, discountRate: 0 };
  return { valid: true, discountRate: affiliate.discountRate };
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export async function createAffiliateSession(affiliateId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await kv.set(`aff:session:${token}`, affiliateId, { ex: 60 * 60 * 24 * 30 });
  return token;
}

export async function getAffiliateSession(token: string): Promise<AffiliateAccount | null> {
  const id = await kv.get<string>(`aff:session:${token}`);
  if (!id) return null;
  const account = await kv.get<AffiliateAccountInternal>(`aff:account:${id}`);
  if (!account || account.status !== "active") return null;
  const { passwordHash, ...safe } = account;
  return safe;
}

export async function deleteAffiliateSession(token: string): Promise<void> {
  await kv.del(`aff:session:${token}`);
}

// ---------------------------------------------------------------------------
// Referral stats
// ---------------------------------------------------------------------------

export type ReferralOrder = {
  id: string;
  createdAt: string;
  subtotal: string;
  commission: string;
  status: string;
  items: { product: string; strength: string; qty: number; price: string }[];
};

export async function getAffiliateReferrals(affiliateCode: string): Promise<ReferralOrder[]> {
  const { listOrders } = await import("./db");
  const orders = await listOrders();
  const rate = 0.25;
  return orders
    .filter((o) => {
      const o2 = o as { refCode?: string; discountCode?: string };
      return o2.refCode === affiliateCode || o2.discountCode === affiliateCode;
    })
    .map((o) => {
      const total = parseFloat(o.subtotal.replace(/[^0-9.]/g, "")) || 0;
      return {
        id: o.id,
        createdAt: o.createdAt,
        subtotal: o.subtotal,
        commission: `$${(total * rate).toFixed(2)}`,
        status: o.status,
        items: o.items,
      };
    });
}
