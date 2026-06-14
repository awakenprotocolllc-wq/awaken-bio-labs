import { kv } from "@vercel/kv";
import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProgramType = "ambassador" | "licensee";

export type AffiliateApplication = {
  id: string;
  name: string;
  email: string;
  platform: string;
  audience?: string;
  about?: string;
  status: "pending" | "approved" | "denied";
  appliedAt: string;
  programType: ProgramType;
};

export type AffiliateAccount = {
  id: string;
  name: string;
  email: string;
  affiliateCode: string;
  /** pending_contract → active → suspended → archived; archived requires re-onboard to return */
  status: "pending_contract" | "active" | "suspended" | "archived";
  programType: ProgramType;  // "ambassador" | "licensee"
  commissionRate: number;    // 0.20 = ambassador, 0.50 = licensee
  discountRate: number;      // 0.10 = 10% customer discount
  joinedAt: string;
  applicationId?: string;
  contractSignedAt?: string;
  archivedAt?: string;
  programSwitchedAt?: string;
};

// Internal — never returned to client
type AffiliateAccountInternal = AffiliateAccount & { passwordHash: string; passwordVersion?: number };

export type ContractToken = {
  token: string;
  affiliateId: string;
  name: string;
  email: string;
  createdAt: string;
  expiresAt: string;
  signed: boolean;
  /** true = re-onboarding; send welcome-back email instead of activation email */
  isReOnboard?: boolean;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function genId(prefix = ""): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

const BCRYPT_ROUNDS = 12;

/** Hash a password with bcrypt (async, slow by design). */
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/** Legacy SHA-256 hash — kept only for lazy migration during login. */
function legacyHash(password: string): string {
  return createHash("sha256").update("awaken-biolabs:" + password).digest("hex");
}

/** Detects the old SHA-256 format: exactly 64 lowercase hex chars. */
const SHA256_RE = /^[0-9a-f]{64}$/;

export function generateAffiliateCode(name: string): string {
  const clean = name.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return clean.slice(0, 8) || "PARTNER";
}

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------

export async function createApplication(
  data: Pick<AffiliateApplication, "name" | "email" | "platform" | "audience" | "about" | "programType">
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
  commissionRate = 0.20,
  discountRate = 0.10,
  programType: ProgramType = "ambassador"
): Promise<AffiliateAccount> {
  const id = genId("aff_");
  const account: AffiliateAccountInternal = {
    id,
    name,
    email: email.toLowerCase(),
    affiliateCode: affiliateCode.toUpperCase(),
    status: "pending_contract", // must sign contract before going active
    programType,
    commissionRate,
    discountRate,
    joinedAt: new Date().toISOString(),
    applicationId,
    passwordHash: await hashPassword(password),
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
  isReOnboard = false
): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const record: ContractToken = {
    token,
    affiliateId,
    name,
    email,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    signed: false,
    isReOnboard,
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

  const stored = account.passwordHash;
  let valid = false;

  if (SHA256_RE.test(stored)) {
    // Legacy SHA-256 hash — verify and lazily migrate to bcrypt
    valid = stored === legacyHash(password);
    if (valid) {
      const newHash = await hashPassword(password);
      await kv.set(`aff:account:${id}`, { ...account, passwordHash: newHash });
    }
  } else {
    // Modern bcrypt hash
    valid = await bcrypt.compare(password, stored);
  }

  if (!valid) return null;
  const { passwordHash, passwordVersion: _pv, ...safe } = account;
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

type AffiliateSessionRecord = { affiliateId: string; passwordVersion: number };

export async function createAffiliateSession(affiliateId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const account = await kv.get<AffiliateAccountInternal>(`aff:account:${affiliateId}`);
  const passwordVersion = account?.passwordVersion ?? 0;
  const record: AffiliateSessionRecord = { affiliateId, passwordVersion };
  await kv.set(`aff:session:${token}`, record, { ex: 60 * 60 * 24 * 30 });
  return token;
}

export async function getAffiliateSession(token: string): Promise<AffiliateAccount | null> {
  const raw = await kv.get<AffiliateSessionRecord | string>(`aff:session:${token}`);
  if (!raw) return null;

  // Support legacy sessions stored as plain affiliateId strings (pre-passwordVersion)
  let affiliateId: string;
  let sessionPasswordVersion: number;
  if (typeof raw === "string") {
    affiliateId = raw;
    sessionPasswordVersion = 0;
  } else {
    affiliateId = raw.affiliateId;
    sessionPasswordVersion = raw.passwordVersion;
  }

  const account = await kv.get<AffiliateAccountInternal>(`aff:account:${affiliateId}`);
  // Block suspended/archived accounts and sessions created before the last password change
  if (!account || account.status !== "active") return null;
  if ((account.passwordVersion ?? 0) !== sessionPasswordVersion) return null;
  const { passwordHash, passwordVersion: _pv, ...safe } = account;
  return safe;
}

export async function deleteAffiliateSession(token: string): Promise<void> {
  await kv.del(`aff:session:${token}`);
}

// ---------------------------------------------------------------------------
// Program switching
// ---------------------------------------------------------------------------

/** Switch an affiliate's program type and update their commission rate accordingly. */
export async function updateAffiliateProgram(
  id: string,
  programType: ProgramType
): Promise<AffiliateAccount | null> {
  const account = await kv.get<AffiliateAccountInternal>(`aff:account:${id}`);
  if (!account) return null;
  const commissionRate = programType === "licensee" ? 0.50 : 0.20;
  const updated: AffiliateAccountInternal = {
    ...account,
    programType,
    commissionRate,
    programSwitchedAt: new Date().toISOString(),
  };
  await kv.set(`aff:account:${id}`, updated);
  const { passwordHash, passwordVersion: _pv3, ...safe } = updated;
  return safe;
}

// ---------------------------------------------------------------------------
// Payout info (ACH)
// ---------------------------------------------------------------------------

export type AffiliatePayoutInfo = {
  holderName: string;
  bankName: string;
  routingNumber: string;
  accountNumber: string;
  accountType: "checking" | "savings";
  updatedAt: string;
};

export async function saveAffiliatePayoutInfo(
  affiliateId: string,
  info: Omit<AffiliatePayoutInfo, "updatedAt">
): Promise<void> {
  await kv.set(`aff:payout:${affiliateId}`, {
    ...info,
    updatedAt: new Date().toISOString(),
  });
}

export async function getAffiliatePayoutInfo(
  affiliateId: string
): Promise<AffiliatePayoutInfo | null> {
  return kv.get<AffiliatePayoutInfo>(`aff:payout:${affiliateId}`);
}

// ---------------------------------------------------------------------------
// Edit affiliate details (admin)
// ---------------------------------------------------------------------------

export async function updateAffiliateDetails(
  id: string,
  updates: { name?: string; email?: string; affiliateCode?: string; commissionRate?: number }
): Promise<AffiliateAccount | null> {
  const account = await kv.get<AffiliateAccountInternal>(`aff:account:${id}`);
  if (!account) return null;

  const newEmail = updates.email ? updates.email.toLowerCase() : null;
  const newCode = updates.affiliateCode ? updates.affiliateCode.toUpperCase() : null;

  // Clean up old email index if email is changing
  if (newEmail && newEmail !== account.email) {
    await kv.del(`aff:email:${account.email}`);
    await kv.set(`aff:email:${newEmail}`, id);
  }

  // Clean up old code index if code is changing
  if (newCode && newCode !== account.affiliateCode) {
    await kv.del(`aff:code:${account.affiliateCode}`);
    await kv.set(`aff:code:${newCode}`, id);
  }

  const updated: AffiliateAccountInternal = {
    ...account,
    name: updates.name ?? account.name,
    email: newEmail ?? account.email,
    affiliateCode: newCode ?? account.affiliateCode,
    commissionRate: updates.commissionRate ?? account.commissionRate,
  };

  await kv.set(`aff:account:${id}`, updated);
  const { passwordHash, passwordVersion: _pv4, ...safe } = updated;
  return safe;
}

// ---------------------------------------------------------------------------
// Archive / Re-onboard
// ---------------------------------------------------------------------------

/** Archive a suspended affiliate. Preserves all data; requires re-onboarding to return. */
export async function archiveAffiliate(id: string): Promise<void> {
  const account = await kv.get<AffiliateAccountInternal>(`aff:account:${id}`);
  if (account) {
    await kv.set(`aff:account:${id}`, {
      ...account,
      status: "archived",
      archivedAt: new Date().toISOString(),
    });
  }
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

type PasswordResetToken = {
  token: string;
  affiliateId: string;
  email: string;
  expiresAt: string;
  used: boolean;
};

const RESET_TTL = 15 * 60; // 15 minutes in seconds

/** Creates a 15-minute reset token for the given email. Returns null silently if email not found. */
export async function createPasswordResetToken(email: string): Promise<string | null> {
  const id = await kv.get<string>(`aff:email:${email.toLowerCase()}`);
  if (!id) return null;
  const token = randomBytes(32).toString("hex");
  const record: PasswordResetToken = {
    token,
    affiliateId: id,
    email: email.toLowerCase(),
    expiresAt: new Date(Date.now() + RESET_TTL * 1000).toISOString(),
    used: false,
  };
  await kv.set(`aff:pwreset:${token}`, record, { ex: RESET_TTL });
  return token;
}

/** Check a token's status without consuming it — used to validate before showing the reset form. */
export async function peekPasswordResetToken(
  token: string
): Promise<"valid" | "used" | "expired" | "invalid"> {
  if (!token) return "invalid";
  const record = await kv.get<PasswordResetToken>(`aff:pwreset:${token}`);
  if (!record) return "invalid";
  if (record.used) return "used";
  if (new Date() > new Date(record.expiresAt)) return "expired";
  return "valid";
}

/** Validates token, updates password hash, marks token used. Returns true on success. */
export async function consumePasswordResetToken(token: string, newPassword: string): Promise<boolean> {
  const record = await kv.get<PasswordResetToken>(`aff:pwreset:${token}`);
  if (!record || record.used) return false;
  if (new Date() > new Date(record.expiresAt)) return false;

  // Fetch the account FIRST — bail early if it doesn't exist
  const account = await kv.get<AffiliateAccountInternal>(`aff:account:${record.affiliateId}`);
  if (!account) return false;

  const newHash = await hashPassword(newPassword);

  const newVersion = (account.passwordVersion ?? 0) + 1;

  // Write new password hash + bump version (invalidates all existing sessions)
  await kv.set(`aff:account:${record.affiliateId}`, {
    ...account,
    passwordHash: newHash,
    passwordVersion: newVersion,
  });

  // Verify the write actually landed before marking the token used
  const verify = await kv.get<AffiliateAccountInternal>(`aff:account:${record.affiliateId}`);
  if (!verify || verify.passwordHash !== newHash) {
    // Write failed — do NOT mark token used so the user can try again
    console.error("[consumePasswordResetToken] KV write verification failed for", record.affiliateId);
    return false;
  }

  // Now safe to mark token as used (prevents replay)
  await kv.set(`aff:pwreset:${token}`, { ...record, used: true }, { ex: 60 * 60 });
  return true;
}

/** Directly set a partner's password (admin use only). Returns true on success. */
export async function setAffiliatePassword(affiliateId: string, newPassword: string): Promise<boolean> {
  const account = await kv.get<AffiliateAccountInternal>(`aff:account:${affiliateId}`);
  if (!account) return false;
  const newHash = await hashPassword(newPassword);
  const newVersion = (account.passwordVersion ?? 0) + 1;
  // Bump passwordVersion to invalidate all existing sessions
  await kv.set(`aff:account:${affiliateId}`, { ...account, passwordHash: newHash, passwordVersion: newVersion });
  // Verify write
  const verify = await kv.get<AffiliateAccountInternal>(`aff:account:${affiliateId}`);
  return !!verify && verify.passwordHash === newHash;
}

// ---------------------------------------------------------------------------
// Payout records  (admin records confirmed payments per affiliate per month)
// ---------------------------------------------------------------------------

export type PayoutRecord = {
  affiliateId: string;
  month: string;           // "YYYY-MM" — the earnings month being paid
  amount: number;          // actual $ disbursed
  confirmationCode: string; // ACH trace / wire ref / check number
  paidAt: string;          // ISO timestamp
  note?: string;
};

export async function savePayoutRecord(
  affiliateId: string,
  month: string,
  data: { amount: number; confirmationCode: string; note?: string }
): Promise<PayoutRecord> {
  const record: PayoutRecord = { affiliateId, month, paidAt: new Date().toISOString(), ...data };
  await kv.set(`aff:payoutrec:${affiliateId}:${month}`, record);
  return record;
}

export async function getPayoutRecord(affiliateId: string, month: string): Promise<PayoutRecord | null> {
  return kv.get<PayoutRecord>(`aff:payoutrec:${affiliateId}:${month}`);
}

export async function getPayoutRecordsForMonths(
  affiliateId: string,
  months: string[]
): Promise<Record<string, PayoutRecord>> {
  if (!months.length) return {};
  const records = await Promise.all(months.map((m) => kv.get<PayoutRecord>(`aff:payoutrec:${affiliateId}:${m}`)));
  const out: Record<string, PayoutRecord> = {};
  months.forEach((m, i) => { if (records[i]) out[m] = records[i]!; });
  return out;
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
  const [orders, affiliate] = await Promise.all([
    listOrders(),
    getAffiliateByCode(affiliateCode),
  ]);
  const rate = affiliate?.commissionRate ?? 0.20;
  return orders
    .filter((o) => {
      const o2 = o as { refCode?: string; discountCode?: string };
      return o2.refCode === affiliateCode || o2.discountCode === affiliateCode;
    })
    .map((o) => {
      const total = parseFloat(o.subtotal.replace(/[^0-9.]/g, "")) || 0;
      // Commission on gross subtotal (products only, before discount and shipping)
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
