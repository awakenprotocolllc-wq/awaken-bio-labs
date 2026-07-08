import { kv } from "@vercel/kv";
import { randomBytes, createCipheriv, createDecipheriv } from "crypto";
import bcrypt from "bcryptjs";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CustomerAddress = {
  id: string;
  line1: string;
  city: string;
  state: string;
  zip: string;
  isDefault: boolean;
};

export type CustomerAccount = {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  verifiedAt?: string;
  createdAt: string;
  lastLoginAt?: string;
  marketingOptIn: boolean;
  addresses: CustomerAddress[];
  adminNote?: string;
  researcherCategory?: string;
  businessType?: string;
  institution?: string;
};

type CustomerAccountInternal = CustomerAccount & {
  passwordHash: string;
  passwordVersion: number;
};

export type SavedPayment = {
  last4: string;
  brand: "visa" | "mc" | "amex" | "other";
  expiryMonth: string;
  expiryYear: string;
  encryptedCard: string;
};

type SessionRecord = {
  customerId: string;
  passwordVersion: number;
  ip?: string;
  ua?: string;
};

type SessionContext = { ip: string; ua: string };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function genId(prefix = "cust_"): string {
  return prefix + randomBytes(8).toString("hex");
}

const BCRYPT_ROUNDS = 12;
const SESSION_TTL   = 60 * 60 * 24 * 7;   // 7 days default
const SESSION_TTL_LONG = 60 * 60 * 24 * 30; // 30 days if "remember me"

// ---------------------------------------------------------------------------
// Payment encryption (AES-256-GCM)
// Falls back to PAYOUT_ENCRYPTION_KEY so the site works without a new env var.
// Set CUSTOMER_PAYMENT_KEY in Vercel for proper key isolation.
// ---------------------------------------------------------------------------

const ALG = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;
const PREFIX = "v1:";

function getPaymentKey(): Buffer {
  const hex = process.env.CUSTOMER_PAYMENT_KEY ?? process.env.PAYOUT_ENCRYPTION_KEY ?? "";
  if (hex.length !== 64 || !/^[0-9a-f]+$/i.test(hex)) {
    throw new Error(
      "CUSTOMER_PAYMENT_KEY (or PAYOUT_ENCRYPTION_KEY) must be a 64-hex AES-256 key. " +
      "Generate: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  return Buffer.from(hex, "hex");
}

function encryptCard(plaintext: string): string {
  const key = getPaymentKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALG, key, iv);
  const body = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("hex")}:${tag.toString("hex")}:${body.toString("hex")}`;
}

function decryptCard(value: string): string {
  if (!value.startsWith(PREFIX)) return value;
  const key = getPaymentKey();
  const parts = value.slice(PREFIX.length).split(":");
  if (parts.length !== 3) throw new Error("Malformed encrypted card field");
  const [ivHex, tagHex, ctHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const ct = Buffer.from(ctHex, "hex");
  if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) throw new Error("Malformed encrypted card field");
  const decipher = createDecipheriv(ALG, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

// ---------------------------------------------------------------------------
// Accounts — CRUD
// ---------------------------------------------------------------------------

export async function createCustomer(
  email: string,
  name: string,
  password: string,
  meta?: { researcherCategory?: string; businessType?: string; institution?: string }
): Promise<CustomerAccount> {
  const existing = await kv.get<string>(`cust:email:${email.toLowerCase()}`);
  if (existing) throw new Error("EMAIL_TAKEN");

  const id = genId();
  const account: CustomerAccountInternal = {
    id,
    email: email.toLowerCase(),
    name: name.trim(),
    passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
    passwordVersion: 0,
    emailVerified: false,
    createdAt: new Date().toISOString(),
    marketingOptIn: false,
    addresses: [],
    ...(meta?.researcherCategory ? { researcherCategory: meta.researcherCategory } : {}),
    ...(meta?.businessType ? { businessType: meta.businessType } : {}),
    ...(meta?.institution ? { institution: meta.institution } : {}),
  };

  await kv.set(`cust:${id}`, account);
  await kv.set(`cust:email:${email.toLowerCase()}`, id);
  await kv.zadd("cust:index", { score: Date.now(), member: id });

  const { passwordHash, passwordVersion, ...safe } = account;
  return safe;
}

export async function getCustomerById(id: string): Promise<CustomerAccount | null> {
  const raw = await kv.get<CustomerAccountInternal>(`cust:${id}`);
  if (!raw) return null;
  const { passwordHash, passwordVersion, ...safe } = raw;
  return safe;
}

export async function getCustomerByEmail(email: string): Promise<CustomerAccount | null> {
  const id = await kv.get<string>(`cust:email:${email.toLowerCase()}`);
  if (!id) return null;
  return getCustomerById(id);
}

export async function updateCustomer(
  id: string,
  updates: Partial<Pick<CustomerAccount, "name" | "email" | "marketingOptIn" | "addresses" | "lastLoginAt" | "emailVerified" | "verifiedAt" | "adminNote">>
): Promise<CustomerAccount | null> {
  const raw = await kv.get<CustomerAccountInternal>(`cust:${id}`);
  if (!raw) return null;

  if (updates.email && updates.email.toLowerCase() !== raw.email) {
    await kv.del(`cust:email:${raw.email}`);
    await kv.set(`cust:email:${updates.email.toLowerCase()}`, id);
    updates.email = updates.email.toLowerCase();
  }

  const updated: CustomerAccountInternal = { ...raw, ...updates };
  await kv.set(`cust:${id}`, updated);
  const { passwordHash, passwordVersion, ...safe } = updated;
  return safe;
}

export async function listCustomers(): Promise<CustomerAccount[]> {
  const ids = (await kv.zrange("cust:index", 0, -1, { rev: true })) as string[];
  if (!ids.length) return [];
  const accounts = await Promise.all(ids.map((id) => kv.get<CustomerAccountInternal>(`cust:${id}`)));
  return (accounts.filter(Boolean) as CustomerAccountInternal[]).map(
    ({ passwordHash, passwordVersion, ...safe }) => safe
  );
}

// ---------------------------------------------------------------------------
// Auth — login
// ---------------------------------------------------------------------------

export async function validateCustomerLogin(
  email: string,
  password: string
): Promise<CustomerAccount | null> {
  const id = await kv.get<string>(`cust:email:${email.toLowerCase()}`);
  if (!id) return null;

  const raw = await kv.get<CustomerAccountInternal>(`cust:${id}`);
  if (!raw) return null;

  const valid = await bcrypt.compare(password, raw.passwordHash);
  if (!valid) return null;

  // Stamp last login
  const updated: CustomerAccountInternal = { ...raw, lastLoginAt: new Date().toISOString() };
  await kv.set(`cust:${id}`, updated);

  const { passwordHash, passwordVersion, ...safe } = updated;
  return safe;
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export async function createCustomerSession(
  customerId: string,
  context?: SessionContext,
  rememberMe = false
): Promise<string> {
  const raw = await kv.get<CustomerAccountInternal>(`cust:${customerId}`);
  const passwordVersion = raw?.passwordVersion ?? 0;

  const token = randomBytes(32).toString("hex");
  const record: SessionRecord = {
    customerId,
    passwordVersion,
    ...(context ? { ip: context.ip, ua: context.ua.slice(0, 200) } : {}),
  };
  const ttl = rememberMe ? SESSION_TTL_LONG : SESSION_TTL;
  await kv.set(`cust:session:${token}`, record, { ex: ttl });
  await kv.sadd(`cust:sessions:${customerId}`, token);
  await kv.expire(`cust:sessions:${customerId}`, ttl);
  return token;
}

export async function getCustomerSession(
  token: string | undefined,
  context?: SessionContext
): Promise<CustomerAccount | null> {
  if (!token) return null;
  const record = await kv.get<SessionRecord>(`cust:session:${token}`);
  if (!record) return null;

  const raw = await kv.get<CustomerAccountInternal>(`cust:${record.customerId}`);
  if (!raw) return null;
  if ((raw.passwordVersion ?? 0) !== record.passwordVersion) return null;

  if (context) {
    if (record.ua && context.ua.slice(0, 200) !== record.ua) {
      console.warn("[cust-session] UA mismatch — rejecting");
      return null;
    }
    if (record.ip && context.ip !== record.ip) {
      console.log(`[cust-session] IP change: ${record.ip} → ${context.ip}`);
    }
  }

  const { passwordHash, passwordVersion, ...safe } = raw;
  return safe;
}

export async function deleteCustomerSession(token: string): Promise<void> {
  await kv.del(`cust:session:${token}`);
}

export async function revokeAllCustomerSessions(customerId: string): Promise<void> {
  const raw = await kv.get<CustomerAccountInternal>(`cust:${customerId}`);
  if (!raw) return;
  await kv.set(`cust:${customerId}`, {
    ...raw,
    passwordVersion: (raw.passwordVersion ?? 0) + 1,
  });
}

// ---------------------------------------------------------------------------
// Email verification
// ---------------------------------------------------------------------------

export async function createVerificationToken(customerId: string, email: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await kv.set(`cust:verify:${token}`, { customerId, email }, { ex: 60 * 60 * 24 }); // 24h
  return token;
}

export async function consumeVerificationToken(
  token: string
): Promise<"ok" | "invalid" | "expired"> {
  const record = await kv.get<{ customerId: string; email: string }>(`cust:verify:${token}`);
  if (!record) return "invalid";

  await kv.del(`cust:verify:${token}`);
  await updateCustomer(record.customerId, {
    emailVerified: true,
    verifiedAt: new Date().toISOString(),
  });
  return "ok";
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

export async function createPasswordResetToken(email: string): Promise<string | null> {
  const id = await kv.get<string>(`cust:email:${email.toLowerCase()}`);
  if (!id) return null;

  const token = randomBytes(32).toString("hex");
  await kv.set(
    `cust:reset:${token}`,
    { customerId: id, used: false },
    { ex: 60 * 60 } // 1 hour
  );
  return token;
}

export async function consumePasswordResetToken(
  token: string,
  newPassword: string
): Promise<boolean> {
  const record = await kv.get<{ customerId: string; used: boolean }>(`cust:reset:${token}`);
  if (!record || record.used) return false;

  const raw = await kv.get<CustomerAccountInternal>(`cust:${record.customerId}`);
  if (!raw) return false;

  const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  const newVersion = (raw.passwordVersion ?? 0) + 1;
  await kv.set(`cust:${record.customerId}`, { ...raw, passwordHash: newHash, passwordVersion: newVersion });
  await kv.set(`cust:reset:${token}`, { ...record, used: true }, { ex: 60 * 60 });
  return true;
}

export async function peekPasswordResetToken(token: string): Promise<"valid" | "used" | "invalid"> {
  if (!token) return "invalid";
  const record = await kv.get<{ customerId: string; used: boolean }>(`cust:reset:${token}`);
  if (!record) return "invalid";
  if (record.used) return "used";
  return "valid";
}

// ---------------------------------------------------------------------------
// Change password (from account settings)
// ---------------------------------------------------------------------------

export async function changeCustomerPassword(
  customerId: string,
  currentPassword: string,
  newPassword: string
): Promise<boolean> {
  const raw = await kv.get<CustomerAccountInternal>(`cust:${customerId}`);
  if (!raw) return false;

  const valid = await bcrypt.compare(currentPassword, raw.passwordHash);
  if (!valid) return false;

  const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  const newVersion = (raw.passwordVersion ?? 0) + 1;
  await kv.set(`cust:${customerId}`, { ...raw, passwordHash: newHash, passwordVersion: newVersion });
  return true;
}

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------

export async function saveAddress(
  customerId: string,
  address: Omit<CustomerAddress, "id">
): Promise<CustomerAddress> {
  const raw = await kv.get<CustomerAccountInternal>(`cust:${customerId}`);
  if (!raw) throw new Error("Customer not found");

  const newAddr: CustomerAddress = { ...address, id: genId("addr_") };
  let addresses = raw.addresses ?? [];

  if (newAddr.isDefault) {
    addresses = addresses.map((a) => ({ ...a, isDefault: false }));
  }
  if (addresses.length === 0) newAddr.isDefault = true;

  addresses.push(newAddr);
  await kv.set(`cust:${customerId}`, { ...raw, addresses });
  return newAddr;
}

export async function deleteAddress(customerId: string, addressId: string): Promise<void> {
  const raw = await kv.get<CustomerAccountInternal>(`cust:${customerId}`);
  if (!raw) return;
  const addresses = (raw.addresses ?? []).filter((a) => a.id !== addressId);
  // Ensure there's still a default if we deleted the default
  if (addresses.length > 0 && !addresses.some((a) => a.isDefault)) {
    addresses[0].isDefault = true;
  }
  await kv.set(`cust:${customerId}`, { ...raw, addresses });
}

export async function setDefaultAddress(customerId: string, addressId: string): Promise<void> {
  const raw = await kv.get<CustomerAccountInternal>(`cust:${customerId}`);
  if (!raw) return;
  const addresses = (raw.addresses ?? []).map((a) => ({ ...a, isDefault: a.id === addressId }));
  await kv.set(`cust:${customerId}`, { ...raw, addresses });
}

// ---------------------------------------------------------------------------
// Saved payment
// ---------------------------------------------------------------------------

type RawCard = {
  number: string;
  holderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
};

function detectBrand(number: string): SavedPayment["brand"] {
  const n = number.replace(/\D/g, "");
  if (/^4/.test(n)) return "visa";
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "mc";
  if (/^3[47]/.test(n)) return "amex";
  return "other";
}

export async function saveCustomerPayment(
  customerId: string,
  card: RawCard
): Promise<Pick<SavedPayment, "last4" | "brand" | "expiryMonth" | "expiryYear">> {
  const digits = card.number.replace(/\D/g, "");
  const last4 = digits.slice(-4);
  const brand = detectBrand(digits);

  const encryptedCard = encryptCard(JSON.stringify(card));
  const saved: SavedPayment = { last4, brand, expiryMonth: card.expiryMonth, expiryYear: card.expiryYear, encryptedCard };
  await kv.set(`cust:payment:${customerId}`, saved);
  return { last4, brand, expiryMonth: card.expiryMonth, expiryYear: card.expiryYear };
}

export async function getCustomerPaymentDisplay(
  customerId: string
): Promise<Pick<SavedPayment, "last4" | "brand" | "expiryMonth" | "expiryYear"> | null> {
  const raw = await kv.get<SavedPayment>(`cust:payment:${customerId}`);
  if (!raw) return null;
  return { last4: raw.last4, brand: raw.brand, expiryMonth: raw.expiryMonth, expiryYear: raw.expiryYear };
}

export async function getCustomerPaymentDecrypted(customerId: string): Promise<RawCard | null> {
  const raw = await kv.get<SavedPayment>(`cust:payment:${customerId}`);
  if (!raw?.encryptedCard) return null;
  try {
    return JSON.parse(decryptCard(raw.encryptedCard)) as RawCard;
  } catch {
    return null;
  }
}

export async function deleteCustomerPayment(customerId: string): Promise<void> {
  await kv.del(`cust:payment:${customerId}`);
}

// ---------------------------------------------------------------------------
// Customer ↔ Order index
// ---------------------------------------------------------------------------

export async function linkOrderToCustomer(customerId: string, orderId: string): Promise<void> {
  await kv.zadd(`cust:orders:${customerId}`, { score: Date.now(), member: orderId });
}

export async function getCustomerOrderIds(customerId: string): Promise<string[]> {
  return (await kv.zrange(`cust:orders:${customerId}`, 0, -1, { rev: true })) as string[];
}

// ---------------------------------------------------------------------------
// GDPR deletion
// ---------------------------------------------------------------------------

async function scanKvPattern(pattern: string): Promise<string[]> {
  const keys: string[] = [];
  let cursor: string | number = 0;
  do {
    const result: [string, string[]] = await kv.scan(cursor, { match: pattern, count: 100 });
    keys.push(...result[1]);
    cursor = result[0];
  } while (cursor !== "0");
  return keys;
}

export async function deleteCustomerAccount(customerId: string): Promise<{ keysDeleted: number }> {
  const raw = await kv.get<CustomerAccountInternal>(`cust:${customerId}`);
  if (!raw) return { keysDeleted: 0 };

  const toDelete = [
    `cust:${customerId}`,
    `cust:email:${raw.email}`,
    `cust:payment:${customerId}`,
    `cust:orders:${customerId}`,
    `acr:cart:${customerId}`, // abandoned-cart record — deleted accounts get no reminders
  ];

  // Remove from abandoned-cart scheduling indexes (best-effort)
  try { await kv.zrem("acr:active", customerId); } catch { /* best-effort */ }
  try { await kv.zrem("acr:index", customerId); } catch { /* best-effort */ }

  // Session tokens from reverse-index
  try {
    const tokens = (await kv.smembers(`cust:sessions:${customerId}`)) as string[];
    for (const t of tokens) toDelete.push(`cust:session:${t}`);
    toDelete.push(`cust:sessions:${customerId}`);
  } catch { /* best-effort */ }

  // Any pending verify/reset tokens (pattern scan — low volume)
  try {
    const vKeys = await scanKvPattern(`cust:verify:*`);
    // We can't filter by customerId here without reading each — skip for privacy (tokens expire)
    void vKeys;
  } catch { /* best-effort */ }

  const [first, ...rest] = toDelete;
  let keysDeleted = 0;
  if (first) {
    try { keysDeleted += await kv.del(first, ...rest); } catch { /* best-effort */ }
  }

  try { await kv.zrem("cust:index", customerId); keysDeleted++; } catch { /* best-effort */ }

  return { keysDeleted };
}
