import { createHmac, timingSafeEqual } from "crypto";

// =============================================================================
// Unsubscribe tokens — HMAC-SHA256 signed, no database IDs, no login required.
//
// Format: v1.<base64url(email)>.<issuedAtSeconds>.<base64url(hmac)>
//
// Validity window is deliberately long (400 days): CAN-SPAM requires the
// opt-out mechanism in a message to keep working for at least 30 days after
// send, and an unsubscribe link that only unsubscribes carries no meaningful
// risk from a longer window. Tampering fails the HMAC check.
//
// Requires UNSUBSCRIBE_TOKEN_SECRET (32+ random bytes, hex/base64) in env.
// Fails closed when missing.
// =============================================================================

const MAX_AGE_SECONDS = 60 * 60 * 24 * 400;

function getSecret(): string | null {
  const s = process.env.UNSUBSCRIBE_TOKEN_SECRET;
  return s && s.length >= 16 ? s : null;
}

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Buffer {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded, "base64");
}

// Purpose is bound into the signature so a token minted for one action can
// never be replayed against another (e.g. a subscribe-confirmation token can
// not be used to unsubscribe, and vice versa).
export type TokenPurpose = "unsub" | "confirm";

function sign(email: string, issuedAt: number, secret: string, purpose: TokenPurpose): Buffer {
  return createHmac("sha256", secret).update(`${purpose}.${email}.${issuedAt}`).digest();
}

/** Returns null when UNSUBSCRIBE_TOKEN_SECRET is not configured. */
export function createUnsubscribeToken(email: string, purpose: TokenPurpose = "unsub"): string | null {
  const secret = getSecret();
  if (!secret) return null;
  const norm = String(email ?? "").trim().toLowerCase();
  if (!norm) return null;
  const issuedAt = Math.floor(Date.now() / 1000);
  const sig = sign(norm, issuedAt, secret, purpose);
  return `v1.${b64url(Buffer.from(norm, "utf8"))}.${issuedAt}.${b64url(sig)}`;
}

export type TokenVerification =
  | { valid: true; email: string }
  | { valid: false; reason: "malformed" | "bad_signature" | "expired" | "not_configured" };

export function verifyUnsubscribeToken(token: string, purpose: TokenPurpose = "unsub"): TokenVerification {
  const secret = getSecret();
  if (!secret) return { valid: false, reason: "not_configured" };

  const parts = String(token ?? "").split(".");
  if (parts.length !== 4 || parts[0] !== "v1") return { valid: false, reason: "malformed" };

  let email: string;
  let providedSig: Buffer;
  const issuedAt = parseInt(parts[2], 10);
  try {
    email = fromB64url(parts[1]).toString("utf8");
    providedSig = fromB64url(parts[3]);
  } catch {
    return { valid: false, reason: "malformed" };
  }
  if (!email || !Number.isFinite(issuedAt) || issuedAt <= 0) {
    return { valid: false, reason: "malformed" };
  }

  const expected = sign(email, issuedAt, secret, purpose);
  if (providedSig.length !== expected.length || !timingSafeEqual(providedSig, expected)) {
    return { valid: false, reason: "bad_signature" };
  }

  const ageSeconds = Math.floor(Date.now() / 1000) - issuedAt;
  if (ageSeconds > MAX_AGE_SECONDS || ageSeconds < -300) {
    return { valid: false, reason: "expired" };
  }

  return { valid: true, email };
}
