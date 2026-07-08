import { kv } from "@vercel/kv";
import { canSendMarketingEmail, recordAuditEvent } from "./marketing-consent";
import { sendMarketingEmail } from "./marketing-email";
import { buildAbandonedCartHtml, abandonedCartSubject } from "./abandoned-cart-emails";
import { products, slugify, getPriceForStrength, isOrderable } from "./products";
import { getOutOfStockSlugs } from "./stock-db";

// =============================================================================
// ABANDONED CART RECOVERY — authenticated customers only.
//
// The storefront cart is client-side (localStorage). Authenticated customers'
// carts are mirrored server-side via POST /api/cart/sync; that mirror is the
// "cart" for reminder purposes. One active cart per customer — the cart ID is
// the customer ID (already a non-sequential random hex ID, never exposed in
// URLs; the return link carries no identifier at all).
//
// Guests never enter this system: /api/cart/sync requires a customer session.
//
// Email classification: abandoned-cart reminders are COMMERCIAL email. Every
// send goes through sendMarketingEmail(), which enforces the central
// suppression/unsubscribe model, footer, and List-Unsubscribe headers.
// Consequence: only customers with confirmed marketing consent receive them.
//
// Keys:
//   acr:cart:<customerId>          — AbandonedCartRecord
//   acr:active                     — zset of customerIds with an active sequence (score = lastActivityAt ms)
//   acr:index                      — zset of all customerIds ever tracked (score = updatedAt ms, admin view)
//   acr:lock:<cid>:<stage>:<epoch> — per-stage idempotency lock (NX, 6h TTL)
// =============================================================================

export type AcrItem = { product: string; strength: string; price: string; qty: number };

export type AcrStatus = "active" | "converted" | "cancelled" | "completed_sequence";

export type AcrCancelReason =
  | "cart_emptied"
  | "account_deleted"
  | "not_marketing_eligible"
  | "items_unavailable";

export type AbandonedCartRecord = {
  customerId: string;             // cart ID == customer ID
  items: AcrItem[];
  lastActivityAt: string;         // ISO — last meaningful activity
  sequenceStartedAt: string;      // ISO
  status: AcrStatus;
  /** stage (1|2|3) → ISO timestamp actually sent */
  sentStages: Record<string, string>;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: AcrCancelReason;
  convertedAt?: string;
  recoveredOrderId?: string;
  /** true when at least one reminder was sent before the conversion —
      "reminder-associated", NOT proof of causation */
  reminderAssociated?: boolean;
  createdAt: string;
  updatedAt: string;
};

const CART_KEY = (cid: string) => `acr:cart:${cid}`;
const ACTIVE_ZSET = "acr:active";
const INDEX_ZSET = "acr:index";
export const MAX_REMINDER_STAGES = 3;

// ---------------------------------------------------------------------------
// Configurable timing — hours of inactivity before each stage.
// ---------------------------------------------------------------------------

export function getReminderScheduleHours(): [number, number, number] {
  const read = (name: string, fallback: number): number => {
    const v = parseFloat(process.env[name] ?? "");
    return Number.isFinite(v) && v > 0 ? v : fallback;
  };
  return [
    read("ABANDONED_CART_REMINDER_1_HOURS", 1),
    read("ABANDONED_CART_REMINDER_2_HOURS", 24),
    read("ABANDONED_CART_REMINDER_3_HOURS", 72),
  ];
}

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

export async function getAbandonedCart(customerId: string): Promise<AbandonedCartRecord | null> {
  return kv.get<AbandonedCartRecord>(CART_KEY(customerId));
}

async function saveRecord(record: AbandonedCartRecord): Promise<void> {
  record.updatedAt = new Date().toISOString();
  await kv.set(CART_KEY(record.customerId), record);
  await kv.zadd(INDEX_ZSET, { score: Date.now(), member: record.customerId });
  if (record.status === "active") {
    await kv.zadd(ACTIVE_ZSET, { score: Date.parse(record.lastActivityAt), member: record.customerId });
  } else {
    await kv.zrem(ACTIVE_ZSET, record.customerId);
  }
}

// ---------------------------------------------------------------------------
// Meaningful activity — called from POST /api/cart/sync on every authenticated
// cart mutation (add / remove / qty change / checkout page view sync).
// Resets the abandonment timer. An empty cart durably cancels the sequence.
// ---------------------------------------------------------------------------

export async function recordCartActivity(
  customerId: string,
  items: AcrItem[]
): Promise<AbandonedCartRecord | null> {
  const now = new Date().toISOString();
  const existing = await getAbandonedCart(customerId);

  if (!items.length) {
    if (existing && existing.status === "active") {
      await cancelSequence(customerId, "cart_emptied");
    }
    return null;
  }

  // completed_sequence is terminal for this cart episode: further activity on
  // the same un-purchased cart never restarts reminders (anti-nag cap). A new
  // episode begins only after conversion or emptying replaced the record.
  if (existing && existing.status === "completed_sequence") {
    const updated: AbandonedCartRecord = { ...existing, items, lastActivityAt: now };
    await saveRecord(updated);
    return updated;
  }

  if (existing && existing.status === "active") {
    // Resumed activity: reset the abandonment timer. Already-sent stages stay
    // sent (never re-sent); the next unsent stage re-times from this activity.
    const updated: AbandonedCartRecord = { ...existing, items, lastActivityAt: now };
    await saveRecord(updated);
    return updated;
  }

  // No record, or previous episode ended (converted / cancelled) → fresh sequence
  const record: AbandonedCartRecord = {
    customerId,
    items,
    lastActivityAt: now,
    sequenceStartedAt: now,
    status: "active",
    sentStages: {},
    createdAt: now,
    updatedAt: now,
  };
  await saveRecord(record);
  return record;
}

// ---------------------------------------------------------------------------
// Durable cancellation
// ---------------------------------------------------------------------------

export async function cancelSequence(customerId: string, reason: AcrCancelReason): Promise<void> {
  const record = await getAbandonedCart(customerId);
  if (!record || record.status !== "active") {
    await kv.zrem(ACTIVE_ZSET, customerId);
    return;
  }
  const cancelled: AbandonedCartRecord = {
    ...record,
    status: "cancelled",
    cancelledAt: new Date().toISOString(),
    cancelReason: reason,
  };
  await saveRecord(cancelled);
  await recordAuditEvent({
    event: "acr_cancelled",
    email: "",
    source: "abandoned_cart",
    detail: `${customerId}: ${reason}`,
  });
}

// ---------------------------------------------------------------------------
// Conversion — called from order creation (lib/db.createOrder) for any order
// placed by a logged-in customer. Immediately and durably stops all stages.
// ---------------------------------------------------------------------------

export async function markCartConverted(customerId: string, orderId: string): Promise<void> {
  const record = await getAbandonedCart(customerId);
  await kv.zrem(ACTIVE_ZSET, customerId);
  if (!record || record.status === "converted") return;

  const anySent = Object.keys(record.sentStages).length > 0;
  const converted: AbandonedCartRecord = {
    ...record,
    status: "converted",
    convertedAt: new Date().toISOString(),
    recoveredOrderId: orderId,
    reminderAssociated: anySent,
  };
  await saveRecord(converted);
  if (anySent) {
    await recordAuditEvent({
      event: "acr_converted",
      email: "",
      source: "abandoned_cart",
      detail: `${customerId}: order ${orderId} (reminder-associated)`,
    });
  }
}

// ---------------------------------------------------------------------------
// Item validity — a reminder only counts items that are still purchasable
// (in catalog, orderable price, not toggled out of stock).
// ---------------------------------------------------------------------------

function filterValidItems(items: AcrItem[], outOfStockSlugs: Set<string>): AcrItem[] {
  return items.filter((item) => {
    const product = products.find((p) => p.name === item.product);
    if (!product) return false;
    if (!isOrderable(product, item.strength)) return false;
    if (outOfStockSlugs.has(slugify(product.name))) return false;
    return true;
  });
}

function currentSubtotal(items: AcrItem[]): string {
  const total = items.reduce((sum, item) => {
    const product = products.find((p) => p.name === item.product);
    const price = product ? getPriceForStrength(product, item.strength) : null;
    const n = price ? parseFloat(price.replace(/[^0-9.]/g, "")) : 0;
    return sum + (isNaN(n) ? 0 : n) * item.qty;
  }, 0);
  return `$${total.toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// The processor — invoked by the hourly cron. Idempotent under duplicate
// execution, retries, and concurrent instances (per-stage NX locks + a
// post-lock re-read). Sends at most ONE stage per cart per run.
//
// EVERY eligibility condition is re-checked here, immediately before send —
// scheduling state is never trusted.
// ---------------------------------------------------------------------------

export type ProcessSummary = {
  scanned: number;
  sent: number;
  skippedNotDue: number;
  skippedLocked: number;
  cancelled: number;
  skippedUnverified: number;
  failed: number;
};

export async function processAbandonedCarts(nowMs: number = Date.now()): Promise<ProcessSummary> {
  const summary: ProcessSummary = {
    scanned: 0, sent: 0, skippedNotDue: 0, skippedLocked: 0,
    cancelled: 0, skippedUnverified: 0, failed: 0,
  };

  const customerIds = ((await kv.zrange(ACTIVE_ZSET, 0, -1)) as string[]) ?? [];
  if (!customerIds.length) return summary;

  const schedule = getReminderScheduleHours();
  const outOfStock = new Set(await getOutOfStockSlugs());
  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://awakenbiolabs.com";

  for (const customerId of customerIds) {
    summary.scanned++;

    // ── Cart still exists and is still active ─────────────────────────────
    const record = await getAbandonedCart(customerId);
    if (!record || record.status !== "active") {
      await kv.zrem(ACTIVE_ZSET, customerId);
      continue;
    }

    // ── Which stage is due? (lowest unsent stage whose threshold elapsed;
    //     timing measured from the LATEST meaningful activity) ──────────────
    const elapsedHours = (nowMs - Date.parse(record.lastActivityAt)) / 3_600_000;
    let stage = 0;
    for (let s = 1; s <= MAX_REMINDER_STAGES; s++) {
      if (!record.sentStages[String(s)] && elapsedHours >= schedule[s - 1]) {
        stage = s;
        break;
      }
    }
    if (stage === 0) { summary.skippedNotDue++; continue; }

    // ── Send-time eligibility re-checks ───────────────────────────────────
    // Account still exists (email read fresh — never a stale stored address)
    const { getCustomerById } = await import("./customer-db");
    const customer = await getCustomerById(customerId);
    if (!customer) {
      await cancelSequence(customerId, "account_deleted");
      summary.cancelled++;
      continue;
    }

    // Verified addresses only (retry later — they may verify tomorrow)
    if (!customer.emailVerified) { summary.skippedUnverified++; continue; }

    // Central suppression / unsubscribe / bounce / complaint model.
    // sendMarketingEmail re-checks this too; checking here lets us durably
    // cancel instead of retrying a permanently ineligible recipient forever.
    if (!(await canSendMarketingEmail(customer.email))) {
      await cancelSequence(customerId, "not_marketing_eligible");
      summary.cancelled++;
      continue;
    }

    // Items still purchasable at current catalog/stock state
    const validItems = filterValidItems(record.items, outOfStock);
    if (!validItems.length) {
      await cancelSequence(customerId, "items_unavailable");
      summary.cancelled++;
      continue;
    }

    // ── Idempotency: per-stage NX lock, scoped to this activity epoch ─────
    const lockKey = `acr:lock:${customerId}:${stage}:${Date.parse(record.lastActivityAt)}`;
    const acquired = await kv.set(lockKey, 1, { nx: true, ex: 6 * 60 * 60 });
    if (acquired === null) { summary.skippedLocked++; continue; }

    // Post-lock re-read — closes the race where another instance sent and
    // saved between our first read and lock acquisition.
    const fresh = await getAbandonedCart(customerId);
    if (!fresh || fresh.status !== "active" || fresh.sentStages[String(stage)]) {
      summary.skippedLocked++;
      continue;
    }

    // ── Send (marketing pipeline: suppression, footer, List-Unsubscribe) ──
    const returnUrl = `${SITE}/cart-return?r=${stage}`;
    const result = await sendMarketingEmail({
      to: customer.email,
      subject: abandonedCartSubject(stage),
      html: buildAbandonedCartHtml({
        stage,
        firstName: customer.name.split(/\s+/)[0] || customer.name,
        items: validItems,
        subtotal: currentSubtotal(validItems),
        returnUrl,
      }),
    });

    if (result.ok) {
      fresh.sentStages[String(stage)] = new Date().toISOString();
      if (stage === MAX_REMINDER_STAGES) {
        fresh.status = "completed_sequence";
        fresh.completedAt = new Date().toISOString();
      }
      await saveRecord(fresh);
      await recordAuditEvent({
        event: "acr_reminder_sent",
        email: customer.email.toLowerCase(),
        source: "abandoned_cart",
        detail: `stage ${stage}`,
      });
      summary.sent++;
    } else if ("skipped" in result && result.skipped && result.reason === "not_eligible") {
      // Became ineligible between our check and the send-time gate
      await kv.del(lockKey);
      await cancelSequence(customerId, "not_marketing_eligible");
      summary.cancelled++;
    } else {
      // Transient failure — release the lock so the next cron run retries
      await kv.del(lockKey);
      summary.failed++;
      console.error(`[acr] stage ${stage} send failed for customer ${customerId}`);
    }
  }

  return summary;
}
