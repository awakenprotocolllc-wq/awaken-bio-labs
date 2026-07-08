import { kv } from "@vercel/kv";

// =============================================================================
// MARKETING CONSENT — single source of truth for marketing email eligibility.
//
// The CustomerAccount.marketingOptIn boolean is a UI convenience only; THIS
// module is authoritative. Keyed by normalized email so suppression survives
// account deletion and applies to non-account addresses too.
//
// Keys:
//   mkt:consent:<email>  — MarketingConsent record
//   mkt:audit            — capped list of audit events (newest first)
// =============================================================================

export type MarketingStatus =
  | "subscribed"
  | "unsubscribed"
  | "suppressed"     // manual/admin suppression
  | "bounced"        // hard bounce reported by provider
  | "complained"     // spam complaint reported by provider
  | "pending_confirmation";

export type MarketingConsent = {
  email: string;                 // normalized (trimmed, lowercased)
  customerId?: string;
  status: MarketingStatus;
  source?: string;               // where consent was captured, e.g. "account_settings"
  consentDisclosureVersion?: string;
  ip?: string;
  userAgent?: string;
  subscribedAt?: string;         // ISO
  unsubscribedAt?: string;       // ISO
  unsubscribeSource?: string;    // "link" | "one_click" | "account_settings" | "admin" | "provider"
  unsubscribeReason?: string;    // voluntary only
  suppressionReason?: string;    // e.g. "hard_bounce", "spam_complaint", "admin"
  lastConsentUpdateAt: string;   // ISO
  createdAt: string;             // ISO
  updatedAt: string;             // ISO
};

// Strictness ordering — a transition to a LOWER rank is never applied
// automatically. complained/bounced can only be cleared by explicit admin
// action (not implemented — flagged in the compliance report).
const STRICTNESS: Record<MarketingStatus, number> = {
  complained: 5,
  bounced: 4,
  suppressed: 3,
  unsubscribed: 2,
  pending_confirmation: 1,
  subscribed: 0,
};

export function normalizeEmail(email: string): string {
  return String(email ?? "").trim().toLowerCase();
}

function consentKey(email: string): string {
  return `mkt:consent:${normalizeEmail(email)}`;
}

export async function getMarketingConsent(email: string): Promise<MarketingConsent | null> {
  const norm = normalizeEmail(email);
  if (!norm) return null;
  return kv.get<MarketingConsent>(consentKey(norm));
}

// ---------------------------------------------------------------------------
// Audit log — internal, capped. Never log tokens or secrets here.
// ---------------------------------------------------------------------------

export type MarketingAuditEvent = {
  ts: string;
  event:
    | "subscribe"
    | "subscribe_blocked"
    | "resubscribe"
    | "unsubscribe"
    | "suppress"
    | "bounce_suppress"
    | "complaint_suppress"
    | "provider_webhook"
    | "admin_override"
    | "marketing_send"
    | "marketing_send_skipped"
    | "provider_sync_failed";
  email: string;
  source?: string;
  actor?: string;   // "customer:<id>", "admin", "provider:resend", "system"
  detail?: string;
};

const AUDIT_KEY = "mkt:audit";
const AUDIT_MAX = 5000;

export async function recordAuditEvent(ev: Omit<MarketingAuditEvent, "ts">): Promise<void> {
  try {
    const entry: MarketingAuditEvent = { ts: new Date().toISOString(), ...ev };
    await kv.lpush(AUDIT_KEY, JSON.stringify(entry));
    await kv.ltrim(AUDIT_KEY, 0, AUDIT_MAX - 1);
  } catch (err) {
    // Audit failures must never break the calling flow
    console.error("[mkt:audit] failed to record event", ev.event, err);
  }
}

// ---------------------------------------------------------------------------
// Subscribe — never silently overrides an opt-out or suppression.
// ---------------------------------------------------------------------------

export type SubscribeResult =
  | { ok: true; status: MarketingStatus }
  | { ok: false; blockedBy: MarketingStatus };

export async function subscribeMarketing(
  email: string,
  opts: {
    source: string;
    customerId?: string;
    ip?: string;
    userAgent?: string;
    consentDisclosureVersion?: string;
    /**
     * Explicit re-opt-in over a prior "unsubscribed" state. Only valid when the
     * request demonstrably comes from the address owner (e.g. their
     * authenticated account settings). Never set this on imports or syncs.
     */
    resubscribe?: boolean;
    actor?: string;
  }
): Promise<SubscribeResult> {
  const norm = normalizeEmail(email);
  const now = new Date().toISOString();
  const existing = await getMarketingConsent(norm);

  if (existing) {
    const rank = STRICTNESS[existing.status];

    // bounced / complained / manually suppressed: never overridden here,
    // even with resubscribe — requires deliberate admin remediation.
    if (rank >= STRICTNESS.suppressed) {
      await recordAuditEvent({
        event: "subscribe_blocked", email: norm, source: opts.source,
        actor: opts.actor, detail: `blocked by ${existing.status}`,
      });
      return { ok: false, blockedBy: existing.status };
    }

    // unsubscribed: only an explicit, owner-initiated resubscribe may restore.
    if (existing.status === "unsubscribed" && !opts.resubscribe) {
      await recordAuditEvent({
        event: "subscribe_blocked", email: norm, source: opts.source,
        actor: opts.actor, detail: "blocked by unsubscribed (no explicit resubscribe)",
      });
      return { ok: false, blockedBy: "unsubscribed" };
    }
  }

  const record: MarketingConsent = {
    ...(existing ?? { createdAt: now }),
    email: norm,
    customerId: opts.customerId ?? existing?.customerId,
    status: "subscribed",
    source: opts.source,
    ip: opts.ip,
    userAgent: opts.userAgent?.slice(0, 300),
    consentDisclosureVersion: opts.consentDisclosureVersion ?? existing?.consentDisclosureVersion,
    subscribedAt: now,
    lastConsentUpdateAt: now,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await kv.set(consentKey(norm), record);
  await recordAuditEvent({
    event: existing?.status === "unsubscribed" ? "resubscribe" : "subscribe",
    email: norm, source: opts.source, actor: opts.actor,
  });
  return { ok: true, status: "subscribed" };
}

// ---------------------------------------------------------------------------
// Unsubscribe — idempotent; never fails a valid opt-out.
// ---------------------------------------------------------------------------

export async function unsubscribeMarketing(
  email: string,
  opts: { source: string; reason?: string; actor?: string }
): Promise<{ ok: true; alreadyUnsubscribed: boolean }> {
  const norm = normalizeEmail(email);
  const now = new Date().toISOString();
  const existing = await getMarketingConsent(norm);

  // Already at unsubscribed-or-stricter → keep the stricter state (idempotent)
  if (existing && STRICTNESS[existing.status] >= STRICTNESS.unsubscribed) {
    return { ok: true, alreadyUnsubscribed: true };
  }

  const record: MarketingConsent = {
    ...(existing ?? { createdAt: now }),
    email: norm,
    status: "unsubscribed",
    unsubscribedAt: now,
    unsubscribeSource: opts.source,
    unsubscribeReason: opts.reason?.slice(0, 500),
    lastConsentUpdateAt: now,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await kv.set(consentKey(norm), record);
  await recordAuditEvent({ event: "unsubscribe", email: norm, source: opts.source, actor: opts.actor });
  return { ok: true, alreadyUnsubscribed: false };
}

// ---------------------------------------------------------------------------
// Suppression — bounce / complaint / manual. Only upgrades strictness.
// ---------------------------------------------------------------------------

export async function suppressMarketing(
  email: string,
  reason: "hard_bounce" | "spam_complaint" | "admin",
  opts: { source: string; actor?: string }
): Promise<void> {
  const norm = normalizeEmail(email);
  const now = new Date().toISOString();
  const status: MarketingStatus =
    reason === "spam_complaint" ? "complained" :
    reason === "hard_bounce"    ? "bounced" : "suppressed";

  const existing = await getMarketingConsent(norm);
  // Never downgrade a stricter existing state
  if (existing && STRICTNESS[existing.status] >= STRICTNESS[status]) return;

  const record: MarketingConsent = {
    ...(existing ?? { createdAt: now }),
    email: norm,
    status,
    suppressionReason: reason,
    lastConsentUpdateAt: now,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await kv.set(consentKey(norm), record);
  await recordAuditEvent({
    event: reason === "spam_complaint" ? "complaint_suppress" : reason === "hard_bounce" ? "bounce_suppress" : "suppress",
    email: norm, source: opts.source, actor: opts.actor,
  });
}

// ---------------------------------------------------------------------------
// THE gate. Every marketing send path must call this immediately before
// dispatch. Fail-safe: any error or unknown state → NOT eligible.
// ---------------------------------------------------------------------------

export async function canSendMarketingEmail(email: string): Promise<boolean> {
  try {
    const norm = normalizeEmail(email);
    if (!norm || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(norm)) return false;
    const record = await getMarketingConsent(norm);
    return record?.status === "subscribed";
  } catch (err) {
    console.error("[mkt:canSend] status check failed — failing closed", err);
    return false;
  }
}
