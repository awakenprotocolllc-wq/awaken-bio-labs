import { sendEmail, escape } from "./email";
import { canSendMarketingEmail, recordAuditEvent, normalizeEmail } from "./marketing-consent";
import { createUnsubscribeToken } from "./unsubscribe-token";
import { business, fullAddress } from "./business";

// =============================================================================
// MARKETING EMAIL SERVICE — the ONLY sanctioned path for commercial email.
//
// Every send through this service:
//   1. Verifies the required business-identity configuration exists
//   2. Checks marketing eligibility (canSendMarketingEmail) AT SEND TIME
//   3. Appends a CAN-SPAM footer: legal identity, physical postal address,
//      and a working unsubscribe link
//   4. Sets List-Unsubscribe + List-Unsubscribe-Post (RFC 8058 one-click)
//   5. Writes an audit event
//
// Transactional email (order confirmations, password resets, receipts, etc.)
// must NOT use this service — it continues to use lib/email.ts directly and
// is not subject to marketing suppression.
//
// Env overrides (fall back to lib/business.ts values):
//   COMPANY_LEGAL_NAME, COMPANY_MAILING_ADDRESS,
//   MARKETING_FROM_NAME, MARKETING_REPLY_TO_EMAIL
// =============================================================================

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://awakenbiolabs.com";

function getIdentity() {
  return {
    legalName: process.env.COMPANY_LEGAL_NAME || business.legalName,
    mailingAddress: process.env.COMPANY_MAILING_ADDRESS || fullAddress(),
    fromName: process.env.MARKETING_FROM_NAME || business.name,
    replyTo: process.env.MARKETING_REPLY_TO_EMAIL || business.email,
  };
}

export function buildMarketingFooter(unsubscribeUrl: string): string {
  const id = getIdentity();
  return `
  <div style="border-top:1px solid #2A2D33;margin-top:32px;padding-top:20px;">
    <p style="font-family:'Courier New',monospace;color:#8A8D93;font-size:11px;line-height:1.7;margin:0 0 12px;">
      You are receiving this email because you opted in to marketing emails from ${escape(id.legalName)}.
    </p>
    <p style="font-family:'Courier New',monospace;color:#8A8D93;font-size:11px;line-height:1.7;margin:0 0 12px;">
      <a href="${escape(unsubscribeUrl)}" style="color:#57C7D6;text-decoration:underline;">Unsubscribe</a>
      — one click, no login required. Opt-out requests are honored promptly.
    </p>
    <p style="font-family:'Courier New',monospace;color:#8A8D93;font-size:10px;line-height:1.7;margin:0;">
      ${escape(id.legalName)}<br />
      ${escape(id.mailingAddress)}
    </p>
  </div>`;
}

export type MarketingSendResult =
  | { ok: true }
  | { ok: false; skipped: true; reason: "not_eligible" | "config_missing" | "token_unavailable" }
  | { ok: false; skipped?: false; error: string };

/**
 * Send a single commercial/marketing email. Eligibility is checked here,
 * immediately before dispatch — audience lists built earlier are not trusted.
 */
export async function sendMarketingEmail(args: {
  to: string;
  subject: string;
  /** Body HTML only — the compliance footer is appended automatically. */
  html: string;
}): Promise<MarketingSendResult> {
  const to = normalizeEmail(args.to);
  const id = getIdentity();

  // Hard gate: legally required identity fields must be present
  if (!id.legalName?.trim() || !id.mailingAddress?.trim()) {
    console.error("[mkt:send] BLOCKED — COMPANY_LEGAL_NAME / COMPANY_MAILING_ADDRESS missing");
    await recordAuditEvent({ event: "marketing_send_skipped", email: to, detail: "config_missing" });
    return { ok: false, skipped: true, reason: "config_missing" };
  }

  // Hard gate: eligibility at send time (fail-closed)
  if (!(await canSendMarketingEmail(to))) {
    await recordAuditEvent({ event: "marketing_send_skipped", email: to, detail: "not_eligible" });
    return { ok: false, skipped: true, reason: "not_eligible" };
  }

  // Unsubscribe token — refuse to send marketing without a working opt-out
  const token = createUnsubscribeToken(to);
  if (!token) {
    console.error("[mkt:send] BLOCKED — UNSUBSCRIBE_TOKEN_SECRET not configured");
    await recordAuditEvent({ event: "marketing_send_skipped", email: to, detail: "token_unavailable" });
    return { ok: false, skipped: true, reason: "token_unavailable" };
  }

  const unsubscribePageUrl = `${SITE}/unsubscribe?token=${encodeURIComponent(token)}`;
  const oneClickUrl = `${SITE}/api/marketing/unsubscribe?token=${encodeURIComponent(token)}`;

  const html = `${args.html}${buildMarketingFooter(unsubscribePageUrl)}`;

  const result = await sendEmail({
    to,
    subject: args.subject,
    html,
    replyTo: id.replyTo,
    headers: {
      // RFC 2369 + RFC 8058 one-click unsubscribe
      "List-Unsubscribe": `<${oneClickUrl}>, <mailto:${id.replyTo}?subject=unsubscribe>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });

  if (!result.ok) {
    return { ok: false, error: "error" in result && typeof result.error === "string" ? result.error : "send failed" };
  }

  await recordAuditEvent({ event: "marketing_send", email: to, detail: args.subject.slice(0, 120) });
  return { ok: true };
}
