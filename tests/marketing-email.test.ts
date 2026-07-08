import { describe, it, expect, beforeEach, vi } from "vitest";

// ── Mocks ────────────────────────────────────────────────────────────────────
const store = new Map<string, unknown>();
vi.mock("@vercel/kv", () => ({
  kv: {
    get: async (key: string) => store.get(key) ?? null,
    set: async (key: string, value: unknown) => { store.set(key, value); return "OK"; },
    lpush: async () => 1,
    ltrim: async () => "OK",
  },
}));

const sentEmails: Array<{ to?: string; subject: string; html: string; headers?: Record<string, string> }> = [];
vi.mock("../lib/email", () => ({
  sendEmail: vi.fn(async (args: { to?: string; subject: string; html: string; headers?: Record<string, string> }) => {
    sentEmails.push(args);
    return { ok: true };
  }),
  escape: (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"),
}));

import { sendMarketingEmail } from "../lib/marketing-email";
import { subscribeMarketing, unsubscribeMarketing, suppressMarketing } from "../lib/marketing-consent";

beforeEach(() => {
  store.clear();
  sentEmails.length = 0;
  process.env.UNSUBSCRIBE_TOKEN_SECRET = "test-secret-with-enough-length-123456";
  delete process.env.COMPANY_LEGAL_NAME;
  delete process.env.COMPANY_MAILING_ADDRESS;
});

describe("sendMarketingEmail — the centralized marketing gate", () => {
  it("sends to a subscribed recipient with compliant footer and headers", async () => {
    await subscribeMarketing("sub@example.com", { source: "test" });
    const result = await sendMarketingEmail({ to: "sub@example.com", subject: "News", html: "<p>Hello</p>" });
    expect(result.ok).toBe(true);
    expect(sentEmails).toHaveLength(1);

    const sent = sentEmails[0];
    // Footer: legal identity + physical postal address + unsubscribe link
    expect(sent.html).toContain("Awaken Biolabs LLC");
    expect(sent.html).toContain("9440 West Sahara Avenue");
    expect(sent.html).toContain("/unsubscribe?token=");
    // RFC 2369 / RFC 8058 headers
    expect(sent.headers?.["List-Unsubscribe"]).toContain("/api/marketing/unsubscribe?token=");
    expect(sent.headers?.["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
  });

  it("skips an unsubscribed recipient at send time", async () => {
    await subscribeMarketing("gone@example.com", { source: "test" });
    await unsubscribeMarketing("gone@example.com", { source: "link" });
    const result = await sendMarketingEmail({ to: "gone@example.com", subject: "News", html: "<p>x</p>" });
    expect(result.ok).toBe(false);
    if (!result.ok && "reason" in result) expect(result.reason).toBe("not_eligible");
    expect(sentEmails).toHaveLength(0);
  });

  it("skips bounced and complained recipients", async () => {
    await subscribeMarketing("bounce@example.com", { source: "test" });
    await suppressMarketing("bounce@example.com", "hard_bounce", { source: "webhook" });
    await subscribeMarketing("complaint@example.com", { source: "test" });
    await suppressMarketing("complaint@example.com", "spam_complaint", { source: "webhook" });

    expect((await sendMarketingEmail({ to: "bounce@example.com", subject: "s", html: "h" })).ok).toBe(false);
    expect((await sendMarketingEmail({ to: "complaint@example.com", subject: "s", html: "h" })).ok).toBe(false);
    expect(sentEmails).toHaveLength(0);
  });

  it("skips recipients with no consent record at all", async () => {
    const result = await sendMarketingEmail({ to: "never@example.com", subject: "s", html: "h" });
    expect(result.ok).toBe(false);
    expect(sentEmails).toHaveLength(0);
  });

  it("refuses to send when the unsubscribe token secret is missing", async () => {
    await subscribeMarketing("sub@example.com", { source: "test" });
    delete process.env.UNSUBSCRIBE_TOKEN_SECRET;
    const result = await sendMarketingEmail({ to: "sub@example.com", subject: "s", html: "h" });
    expect(result.ok).toBe(false);
    if (!result.ok && "reason" in result) expect(result.reason).toBe("token_unavailable");
    expect(sentEmails).toHaveLength(0);
  });

  it("batch send: only eligible recipients receive email", async () => {
    await subscribeMarketing("a@example.com", { source: "test" });
    await subscribeMarketing("b@example.com", { source: "test" });
    await unsubscribeMarketing("b@example.com", { source: "link" });
    await subscribeMarketing("c@example.com", { source: "test" });
    await suppressMarketing("c@example.com", "spam_complaint", { source: "webhook" });

    const audience = ["a@example.com", "b@example.com", "c@example.com", "d@example.com"];
    for (const to of audience) {
      await sendMarketingEmail({ to, subject: "Campaign", html: "<p>x</p>" });
    }
    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0].to).toBe("a@example.com");
  });
});
