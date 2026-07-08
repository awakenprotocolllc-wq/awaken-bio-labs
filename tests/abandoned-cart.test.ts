import { describe, it, expect, beforeEach, vi } from "vitest";

// ── In-memory KV mock (string keys + sorted sets) ────────────────────────────
const store = new Map<string, unknown>();
const zsets = new Map<string, Map<string, number>>();

vi.mock("@vercel/kv", () => ({
  kv: {
    get: async (key: string) => store.get(key) ?? null,
    set: async (key: string, value: unknown, opts?: { nx?: boolean; ex?: number }) => {
      if (opts?.nx && store.has(key)) return null; // atomic NX semantics
      store.set(key, value);
      return "OK";
    },
    del: async (...keys: string[]) => { keys.forEach((k) => store.delete(k)); return keys.length; },
    zadd: async (key: string, { score, member }: { score: number; member: string }) => {
      const z = zsets.get(key) ?? new Map();
      z.set(member, score);
      zsets.set(key, z);
      return 1;
    },
    zrem: async (key: string, member: string) => { zsets.get(key)?.delete(member); return 1; },
    zrange: async (key: string, _s: number, _e: number, opts?: { rev?: boolean }) => {
      const z = zsets.get(key);
      if (!z) return [];
      const sorted = [...z.entries()].sort((a, b) => (opts?.rev ? b[1] - a[1] : a[1] - b[1]));
      return sorted.map(([m]) => m);
    },
    lpush: async () => 1,
    ltrim: async () => "OK",
  },
}));

// ── Email capture ────────────────────────────────────────────────────────────
const sentEmails: Array<{ to?: string; subject: string; html: string }> = [];
vi.mock("../lib/email", () => ({
  sendEmail: vi.fn(async (args: { to?: string; subject: string; html: string }) => {
    sentEmails.push(args);
    return { ok: true };
  }),
  escape: (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"),
}));

// ── Customer directory mock (current email always read at send time) ────────
const customers = new Map<string, { id: string; name: string; email: string; emailVerified: boolean }>();
vi.mock("../lib/customer-db", () => ({
  getCustomerById: vi.fn(async (id: string) => customers.get(id) ?? null),
}));

// ── Tiny catalog + stock mocks ───────────────────────────────────────────────
vi.mock("../lib/products", () => {
  const catalog = [
    { name: "Test Peptide", strengths: ["10mg"], price: "$50.00", category: "GH Axis" },
    { name: "Gone Peptide", strengths: ["5mg"], price: "$30.00", category: "GH Axis" },
  ];
  return {
    products: catalog,
    slugify: (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    getPriceForStrength: (p: { price: string }) => p.price,
    isOrderable: () => true,
  };
});

let outOfStock: string[] = [];
vi.mock("../lib/stock-db", () => ({
  getOutOfStockSlugs: vi.fn(async () => outOfStock),
}));

import {
  recordCartActivity,
  markCartConverted,
  processAbandonedCarts,
  getAbandonedCart,
} from "../lib/abandoned-cart";
import { subscribeMarketing, unsubscribeMarketing, suppressMarketing } from "../lib/marketing-consent";

const ITEM = { product: "Test Peptide", strength: "10mg", price: "$50.00", qty: 1 };
const HOUR = 3_600_000;

async function setupEligibleCustomer(id = "cust_1", email = "buyer@example.com") {
  customers.set(id, { id, name: "Test Buyer", email, emailVerified: true });
  await subscribeMarketing(email, { source: "test" });
  return id;
}

beforeEach(() => {
  store.clear();
  zsets.clear();
  customers.clear();
  sentEmails.length = 0;
  outOfStock = [];
  process.env.UNSUBSCRIBE_TOKEN_SECRET = "test-secret-with-enough-length-123456";
  delete process.env.ABANDONED_CART_REMINDER_1_HOURS;
  delete process.env.ABANDONED_CART_REMINDER_2_HOURS;
  delete process.env.ABANDONED_CART_REMINDER_3_HOURS;
});

describe("abandoned cart recovery", () => {
  it("authenticated cart activity creates an eligible active sequence", async () => {
    const id = await setupEligibleCustomer();
    await recordCartActivity(id, [ITEM]);
    const record = await getAbandonedCart(id);
    expect(record?.status).toBe("active");
    expect(record?.items).toHaveLength(1);
  });

  it("empty cart does not schedule reminders and durably cancels an existing sequence", async () => {
    const id = await setupEligibleCustomer();
    await recordCartActivity(id, []);
    expect(await getAbandonedCart(id)).toBeNull();

    await recordCartActivity(id, [ITEM]);
    await recordCartActivity(id, []); // emptied
    const record = await getAbandonedCart(id);
    expect(record?.status).toBe("cancelled");
    expect(record?.cancelReason).toBe("cart_emptied");
    expect(record?.cancelledAt).toBeTruthy();

    const summary = await processAbandonedCarts(Date.now() + 100 * HOUR);
    expect(summary.sent).toBe(0);
    expect(sentEmails).toHaveLength(0);
  });

  it("order creation converts the cart and immediately stops all later stages", async () => {
    const id = await setupEligibleCustomer();
    await recordCartActivity(id, [ITEM]);
    await processAbandonedCarts(Date.now() + 2 * HOUR); // stage 1 out
    expect(sentEmails).toHaveLength(1);

    await markCartConverted(id, "order123");
    const record = await getAbandonedCart(id);
    expect(record?.status).toBe("converted");
    expect(record?.recoveredOrderId).toBe("order123");
    expect(record?.reminderAssociated).toBe(true); // reminder sent BEFORE conversion

    await processAbandonedCarts(Date.now() + 100 * HOUR); // stages 2 & 3 would be due
    expect(sentEmails).toHaveLength(1); // nothing more
  });

  it("resumed activity resets the abandonment timer (no stale-timing send, no re-send)", async () => {
    const id = await setupEligibleCustomer();
    await recordCartActivity(id, [ITEM]);
    const start = Date.now();
    await processAbandonedCarts(start + 2 * HOUR);
    expect(sentEmails).toHaveLength(1); // stage 1

    // Customer returns and edits the cart — meaningful activity resets timing
    await recordCartActivity(id, [{ ...ITEM, qty: 2 }]);
    // 2h after resumed activity: stage 1 already sent, stage 2 needs 24h → nothing
    await processAbandonedCarts(Date.now() + 2 * HOUR);
    expect(sentEmails).toHaveLength(1);
  });

  it("each stage sends exactly once; no fourth reminder ever sends", async () => {
    const id = await setupEligibleCustomer();
    await recordCartActivity(id, [ITEM]);
    const t0 = Date.now();

    // Stage 1 (due at 1h) — duplicate cron runs
    await processAbandonedCarts(t0 + 2 * HOUR);
    await processAbandonedCarts(t0 + 2 * HOUR);
    await processAbandonedCarts(t0 + 3 * HOUR);
    expect(sentEmails).toHaveLength(1);

    // Stage 2 (due at 24h)
    await processAbandonedCarts(t0 + 25 * HOUR);
    await processAbandonedCarts(t0 + 26 * HOUR);
    expect(sentEmails).toHaveLength(2);

    // Stage 3 (due at 72h)
    await processAbandonedCarts(t0 + 73 * HOUR);
    await processAbandonedCarts(t0 + 74 * HOUR);
    expect(sentEmails).toHaveLength(3);
    expect((await getAbandonedCart(id))?.status).toBe("completed_sequence");

    // No fourth — ever
    await processAbandonedCarts(t0 + 1000 * HOUR);
    expect(sentEmails).toHaveLength(3);
  });

  it("concurrent processor runs do not duplicate sends (race condition)", async () => {
    const id = await setupEligibleCustomer();
    await recordCartActivity(id, [ITEM]);
    const due = Date.now() + 2 * HOUR;
    await Promise.all([processAbandonedCarts(due), processAbandonedCarts(due), processAbandonedCarts(due)]);
    expect(sentEmails).toHaveLength(1); // NX lock guarantees a single winner
  });

  it("unsubscribed customer never receives a reminder; sequence durably cancelled", async () => {
    const id = await setupEligibleCustomer();
    await recordCartActivity(id, [ITEM]);
    await unsubscribeMarketing("buyer@example.com", { source: "link" }); // after scheduling!
    const summary = await processAbandonedCarts(Date.now() + 2 * HOUR);
    expect(sentEmails).toHaveLength(0);
    expect(summary.cancelled).toBe(1);
    expect((await getAbandonedCart(id))?.cancelReason).toBe("not_marketing_eligible");
  });

  it("suppressed (complaint) customer never receives a reminder", async () => {
    const id = await setupEligibleCustomer();
    await recordCartActivity(id, [ITEM]);
    await suppressMarketing("buyer@example.com", "spam_complaint", { source: "webhook" });
    await processAbandonedCarts(Date.now() + 2 * HOUR);
    expect(sentEmails).toHaveLength(0);
  });

  it("customer with no marketing consent record receives nothing", async () => {
    const id = "cust_noconsent";
    customers.set(id, { id, name: "No Consent", email: "nc@example.com", emailVerified: true });
    await recordCartActivity(id, [ITEM]);
    await processAbandonedCarts(Date.now() + 2 * HOUR);
    expect(sentEmails).toHaveLength(0);
  });

  it("send goes to the CURRENT account email, never a stale one", async () => {
    const id = await setupEligibleCustomer(); // buyer@example.com at scheduling time
    await recordCartActivity(id, [ITEM]);

    // Email changes before send; new address is marketing-eligible
    customers.set(id, { id, name: "Test Buyer", email: "new@example.com", emailVerified: true });
    await subscribeMarketing("new@example.com", { source: "test" });

    await processAbandonedCarts(Date.now() + 2 * HOUR);
    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0].to).toBe("new@example.com"); // old address never used
  });

  it("deleted account cancels the sequence at send time", async () => {
    const id = await setupEligibleCustomer();
    await recordCartActivity(id, [ITEM]);
    customers.delete(id); // account deleted after scheduling
    await processAbandonedCarts(Date.now() + 2 * HOUR);
    expect(sentEmails).toHaveLength(0);
    expect((await getAbandonedCart(id))?.cancelReason).toBe("account_deleted");
  });

  it("unverified email is skipped (retried later, not sent)", async () => {
    const id = "cust_unverified";
    customers.set(id, { id, name: "Unverified", email: "uv@example.com", emailVerified: false });
    await subscribeMarketing("uv@example.com", { source: "test" });
    await recordCartActivity(id, [ITEM]);
    const summary = await processAbandonedCarts(Date.now() + 2 * HOUR);
    expect(sentEmails).toHaveLength(0);
    expect(summary.skippedUnverified).toBe(1);
    expect((await getAbandonedCart(id))?.status).toBe("active"); // not cancelled — may verify later
  });

  it("cart whose items all became unavailable is cancelled, not emailed", async () => {
    const id = await setupEligibleCustomer();
    await recordCartActivity(id, [ITEM]);
    outOfStock = ["test-peptide"]; // product toggled out of stock after scheduling
    await processAbandonedCarts(Date.now() + 2 * HOUR);
    expect(sentEmails).toHaveLength(0);
    expect((await getAbandonedCart(id))?.cancelReason).toBe("items_unavailable");
  });

  it("deleted cart record sends nothing and is pruned from the schedule", async () => {
    const id = await setupEligibleCustomer();
    await recordCartActivity(id, [ITEM]);
    store.delete(`acr:cart:${id}`); // record deleted out-of-band
    const summary = await processAbandonedCarts(Date.now() + 2 * HOUR);
    expect(sentEmails).toHaveLength(0);
    expect(summary.sent).toBe(0);
  });

  it("reminder email includes items, subtotal, return CTA, compliance footer, and no-guarantee language", async () => {
    const id = await setupEligibleCustomer();
    await recordCartActivity(id, [{ ...ITEM, qty: 2 }]);
    await processAbandonedCarts(Date.now() + 2 * HOUR);
    const html = sentEmails[0].html;
    expect(html).toContain("Test Peptide");
    expect(html).toContain("$100.00");                 // current subtotal (2 × $50)
    expect(html).toContain("/cart-return?r=1");        // stage-tagged return link, no cart ID
    expect(html).toContain("Awaken Biolabs LLC");      // footer identity
    expect(html).toContain("/unsubscribe?token=");     // working opt-out
    expect(html).toContain("may change");              // no price/inventory guarantee
    expect(html).toContain("research use only");       // compliance framing
  });

  it("respects configurable timing from environment", async () => {
    process.env.ABANDONED_CART_REMINDER_1_HOURS = "6";
    const id = await setupEligibleCustomer();
    await recordCartActivity(id, [ITEM]);
    await processAbandonedCarts(Date.now() + 2 * HOUR); // default 1h would fire; configured 6h must not
    expect(sentEmails).toHaveLength(0);
    await processAbandonedCarts(Date.now() + 7 * HOUR);
    expect(sentEmails).toHaveLength(1);
  });
});
