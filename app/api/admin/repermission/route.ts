import { NextRequest, NextResponse } from "next/server";
import { validateAdminSession } from "@/lib/admin-auth";
import { listCustomers } from "@/lib/customer-db";
import { getMarketingConsent, markPendingConfirmation, recordAuditEvent } from "@/lib/marketing-consent";
import { createUnsubscribeToken } from "@/lib/unsubscribe-token";
import { buildMarketingFooter } from "@/lib/marketing-email";
import { sendEmail, escape } from "@/lib/email";
import { business } from "@/lib/business";
import { apiError } from "@/lib/api-error";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://awakenbiolabs.com";

// =============================================================================
// POST /api/admin/repermission — one-time re-permission campaign (admin only)
//
// Targets customers whose profile has the legacy marketingOptIn=true flag but
// who have NO record in the central consent model (their consent predates it,
// with no timestamp/disclosure evidence). Each receives one email asking them
// to confirm their subscription via a signed link. Until they confirm, they
// remain ineligible for marketing.
//
// Skipped (never contacted):
//   - central status unsubscribed / suppressed / bounced / complained
//   - already subscribed in the central model
//   - unverified account email addresses
//
// Idempotent-ish: addresses marked pending_confirmation can be re-sent only by
// passing { resendPending: true } — a deliberate second admin action.
//
// This email is itself commercial, so it carries the full compliance footer
// and List-Unsubscribe headers.
// =============================================================================

function repermissionHtml(name: string, confirmUrl: string, unsubscribeFooter: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#0A0B0D;">
<div style="background:#0A0B0D;color:#F4F4F2;font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 24px;">

  <div style="border-bottom:1px solid #2A2D33;padding-bottom:24px;margin-bottom:32px;">
    <p style="font-family:'Courier New',monospace;color:#57C7D6;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 12px;">AWAKEN BIO LABS</p>
    <h1 style="color:#F4F4F2;font-size:26px;margin:0;font-weight:700;">Still want to hear from us?</h1>
  </div>

  <p style="color:#D9D9DC;font-size:15px;line-height:1.7;margin:0 0 24px;">
    Hi <strong style="color:#F4F4F2;">${escape(name)}</strong>,<br /><br />
    You previously checked the box in your account settings to receive emails about new
    products and promotions. We&apos;re updating how we manage email preferences, and we&apos;d
    like you to confirm that choice.
  </p>

  <div style="background:#141518;border:1px solid #2A2D33;padding:28px 24px;margin:0 0 24px;text-align:center;">
    <a href="${escape(confirmUrl)}"
       style="display:inline-block;background:#57C7D6;color:#0A0B0D;font-weight:bold;font-size:15px;padding:14px 36px;text-decoration:none;">
      Yes, keep me subscribed
    </a>
    <p style="font-family:'Courier New',monospace;color:#8A8D93;font-size:11px;line-height:1.7;margin:16px 0 0;">
      One click — no login required.
    </p>
  </div>

  <p style="color:#8A8D93;font-size:13px;line-height:1.7;margin:0 0 8px;">
    <strong style="color:#D9D9DC;">If you do nothing, you will not receive marketing emails from us.</strong>
    No action is required to opt out. Order confirmations and account emails are unaffected either way.
  </p>

  ${unsubscribeFooter}

</div>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    if (!(await validateAdminSession(req.cookies.get("awaken_admin")?.value))) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.UNSUBSCRIBE_TOKEN_SECRET) {
      return NextResponse.json(
        { ok: false, error: "UNSUBSCRIBE_TOKEN_SECRET is not configured — set it in Vercel before running the campaign." },
        { status: 500 }
      );
    }

    const body = (await req.json().catch(() => ({}))) ?? {};
    const resendPending = body.resendPending === true;
    const dryRun = body.dryRun === true;

    const customers = await listCustomers();
    const summary = {
      sent: 0,
      skippedAlreadySubscribed: 0,
      skippedOptedOutOrSuppressed: 0,
      skippedPending: 0,
      skippedUnverified: 0,
      failed: 0,
    };

    for (const c of customers) {
      if (!c.marketingOptIn) continue;

      if (!c.emailVerified) {
        summary.skippedUnverified++;
        continue;
      }

      const consent = await getMarketingConsent(c.email);
      if (consent) {
        if (consent.status === "subscribed") { summary.skippedAlreadySubscribed++; continue; }
        if (consent.status === "pending_confirmation") {
          if (!resendPending) { summary.skippedPending++; continue; }
        } else {
          // unsubscribed / suppressed / bounced / complained — never contacted
          summary.skippedOptedOutOrSuppressed++;
          continue;
        }
      }

      if (dryRun) { summary.sent++; continue; }

      const confirmToken = createUnsubscribeToken(c.email, "confirm");
      const unsubToken = createUnsubscribeToken(c.email, "unsub");
      if (!confirmToken || !unsubToken) { summary.failed++; continue; }

      const confirmUrl = `${SITE}/api/marketing/confirm?token=${encodeURIComponent(confirmToken)}`;
      const unsubPageUrl = `${SITE}/unsubscribe?token=${encodeURIComponent(unsubToken)}`;
      const oneClickUrl = `${SITE}/api/marketing/unsubscribe?token=${encodeURIComponent(unsubToken)}`;

      const result = await sendEmail({
        to: c.email,
        subject: "Confirm your email preferences — Awaken Bio Labs",
        html: repermissionHtml(c.name, confirmUrl, buildMarketingFooter(unsubPageUrl)),
        replyTo: business.email,
        headers: {
          "List-Unsubscribe": `<${oneClickUrl}>, <mailto:${business.email}?subject=unsubscribe>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });

      if (result.ok) {
        await markPendingConfirmation(c.email, {
          source: "repermission_campaign",
          customerId: c.id,
          actor: "admin",
        });
        await recordAuditEvent({
          event: "marketing_send",
          email: c.email.toLowerCase(),
          source: "repermission_campaign",
          actor: "admin",
          detail: "re-permission email",
        });
        summary.sent++;
      } else {
        summary.failed++;
        console.error("[repermission] send failed for", c.email);
      }
    }

    console.log("[repermission] campaign complete:", JSON.stringify(summary), dryRun ? "(dry run)" : "");
    return NextResponse.json({ ok: true, dryRun, summary });
  } catch (err) {
    return apiError("POST /api/admin/repermission", err);
  }
}
