import { describe, it, expect, beforeEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// In-memory KV mock — mirrors the @vercel/kv methods marketing-consent uses.
// ---------------------------------------------------------------------------
const store = new Map<string, unknown>();
const lists = new Map<string, string[]>();
let kvShouldThrow = false;

vi.mock("@vercel/kv", () => ({
  kv: {
    get: async (key: string) => {
      if (kvShouldThrow) throw new Error("KV unavailable");
      return store.get(key) ?? null;
    },
    set: async (key: string, value: unknown) => {
      if (kvShouldThrow) throw new Error("KV unavailable");
      store.set(key, value);
      return "OK";
    },
    lpush: async (key: string, value: string) => {
      const l = lists.get(key) ?? [];
      l.unshift(value);
      lists.set(key, l);
      return l.length;
    },
    ltrim: async (key: string, start: number, stop: number) => {
      const l = lists.get(key) ?? [];
      lists.set(key, l.slice(start, stop + 1));
      return "OK";
    },
  },
}));

import {
  subscribeMarketing,
  unsubscribeMarketing,
  suppressMarketing,
  canSendMarketingEmail,
  getMarketingConsent,
} from "../lib/marketing-consent";

beforeEach(() => {
  store.clear();
  lists.clear();
  kvShouldThrow = false;
});

describe("marketing consent lifecycle", () => {
  it("subscribed user is eligible for marketing email", async () => {
    await subscribeMarketing("user@example.com", { source: "test" });
    expect(await canSendMarketingEmail("user@example.com")).toBe(true);
    expect(await canSendMarketingEmail("USER@EXAMPLE.COM")).toBe(true); // normalized
  });

  it("unknown address is NOT eligible (no implied consent)", async () => {
    expect(await canSendMarketingEmail("stranger@example.com")).toBe(false);
  });

  it("unsubscribed user cannot receive marketing email", async () => {
    await subscribeMarketing("user@example.com", { source: "test" });
    await unsubscribeMarketing("user@example.com", { source: "link" });
    expect(await canSendMarketingEmail("user@example.com")).toBe(false);
  });

  it("unsubscribe is idempotent", async () => {
    await subscribeMarketing("user@example.com", { source: "test" });
    const first = await unsubscribeMarketing("user@example.com", { source: "link" });
    const second = await unsubscribeMarketing("user@example.com", { source: "link" });
    expect(first.alreadyUnsubscribed).toBe(false);
    expect(second.alreadyUnsubscribed).toBe(true);
    expect(await canSendMarketingEmail("user@example.com")).toBe(false);
  });

  it("re-subscribing (import-style, no resubscribe flag) does NOT restore an unsubscribed address", async () => {
    await subscribeMarketing("user@example.com", { source: "signup" });
    await unsubscribeMarketing("user@example.com", { source: "link" });
    const result = await subscribeMarketing("user@example.com", { source: "csv_import" });
    expect(result.ok).toBe(false);
    expect(await canSendMarketingEmail("user@example.com")).toBe(false);
  });

  it("owner-initiated resubscribe restores an unsubscribed address", async () => {
    await subscribeMarketing("user@example.com", { source: "signup" });
    await unsubscribeMarketing("user@example.com", { source: "link" });
    const result = await subscribeMarketing("user@example.com", {
      source: "account_settings", resubscribe: true, actor: "customer:c1",
    });
    expect(result.ok).toBe(true);
    expect(await canSendMarketingEmail("user@example.com")).toBe(true);
  });

  it("hard-bounced address cannot receive marketing and cannot be resubscribed", async () => {
    await subscribeMarketing("user@example.com", { source: "test" });
    await suppressMarketing("user@example.com", "hard_bounce", { source: "resend_webhook" });
    expect(await canSendMarketingEmail("user@example.com")).toBe(false);
    const attempt = await subscribeMarketing("user@example.com", {
      source: "account_settings", resubscribe: true,
    });
    expect(attempt.ok).toBe(false);
    if (!attempt.ok) expect(attempt.blockedBy).toBe("bounced");
  });

  it("complaint-suppressed address cannot receive marketing and cannot be resubscribed", async () => {
    await subscribeMarketing("user@example.com", { source: "test" });
    await suppressMarketing("user@example.com", "spam_complaint", { source: "resend_webhook" });
    expect(await canSendMarketingEmail("user@example.com")).toBe(false);
    const attempt = await subscribeMarketing("user@example.com", {
      source: "account_settings", resubscribe: true,
    });
    expect(attempt.ok).toBe(false);
    if (!attempt.ok) expect(attempt.blockedBy).toBe("complained");
  });

  it("suppression never downgrades a stricter state", async () => {
    await suppressMarketing("user@example.com", "spam_complaint", { source: "webhook" });
    await suppressMarketing("user@example.com", "hard_bounce", { source: "webhook" }); // weaker
    const record = await getMarketingConsent("user@example.com");
    expect(record?.status).toBe("complained"); // strictest wins
  });

  it("unsubscribe does not downgrade a complaint suppression", async () => {
    await suppressMarketing("user@example.com", "spam_complaint", { source: "webhook" });
    await unsubscribeMarketing("user@example.com", { source: "link" });
    const record = await getMarketingConsent("user@example.com");
    expect(record?.status).toBe("complained");
  });

  it("fails closed when the datastore is unavailable", async () => {
    await subscribeMarketing("user@example.com", { source: "test" });
    kvShouldThrow = true;
    expect(await canSendMarketingEmail("user@example.com")).toBe(false);
  });

  it("rejects invalid email shapes", async () => {
    expect(await canSendMarketingEmail("")).toBe(false);
    expect(await canSendMarketingEmail("not-an-email")).toBe(false);
  });
});
