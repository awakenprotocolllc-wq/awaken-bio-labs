import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { kv } from "@vercel/kv";
import { suppressMarketing, recordAuditEvent } from "@/lib/marketing-consent";

// =============================================================================
// POST /api/webhooks/resend — provider event sync (bounces, complaints)
//
// Resend signs webhooks with the Svix scheme:
//   signed_content = `${svix-id}.${svix-timestamp}.${rawBody}`
//   signature      = base64(HMAC-SHA256(base64decode(secret), signed_content))
// where the endpoint secret is provided as `whsec_<base64>`.
//
// Env var required: RESEND_WEBHOOK_SECRET (from the Resend dashboard when the
// webhook endpoint is created). Events are rejected when missing/invalid.
//
// Handled events (marketing suppression):
//   email.bounced    → status "bounced"     (hard suppression)
//   email.complained → status "complained"  (hard suppression)
// Other events are acknowledged and ignored.
//
// Idempotency: svix-id is deduplicated via a KV NX key (30-day TTL).
// =============================================================================

const TIMESTAMP_TOLERANCE_SECONDS = 5 * 60;

function verifySvixSignature(
  secret: string,
  msgId: string,
  timestamp: string,
  rawBody: string,
  signatureHeader: string
): boolean {
  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  if (secretBytes.length === 0) return false;

  const signedContent = `${msgId}.${timestamp}.${rawBody}`;
  const expected = createHmac("sha256", secretBytes).update(signedContent).digest();

  // Header may contain multiple space-delimited signatures: "v1,<b64> v1,<b64>"
  for (const part of signatureHeader.split(" ")) {
    const [version, sig] = part.split(",");
    if (version !== "v1" || !sig) continue;
    let provided: Buffer;
    try {
      provided = Buffer.from(sig, "base64");
    } catch {
      continue;
    }
    if (provided.length === expected.length && timingSafeEqual(provided, expected)) {
      return true;
    }
  }
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    if (!secret) {
      console.error("[webhooks/resend] RESEND_WEBHOOK_SECRET not set — rejecting event");
      return NextResponse.json({ ok: false, error: "Not configured" }, { status: 500 });
    }

    const msgId = req.headers.get("svix-id") ?? "";
    const timestamp = req.headers.get("svix-timestamp") ?? "";
    const signature = req.headers.get("svix-signature") ?? "";
    if (!msgId || !timestamp || !signature) {
      return NextResponse.json({ ok: false, error: "Missing signature headers" }, { status: 401 });
    }

    // Replay window check
    const ts = parseInt(timestamp, 10);
    const nowSec = Math.floor(Date.now() / 1000);
    if (!Number.isFinite(ts) || Math.abs(nowSec - ts) > TIMESTAMP_TOLERANCE_SECONDS) {
      return NextResponse.json({ ok: false, error: "Stale timestamp" }, { status: 401 });
    }

    const rawBody = await req.text();
    if (!verifySvixSignature(secret, msgId, timestamp, rawBody, signature)) {
      console.warn("[webhooks/resend] invalid signature");
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
    }

    // Deduplicate — svix retries deliver the same svix-id
    const dedupeKey = `mkt:webhook:seen:${msgId}`;
    const firstDelivery = await kv.set(dedupeKey, 1, { nx: true, ex: 60 * 60 * 24 * 30 });
    if (firstDelivery === null) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    let event: { type?: string; data?: { to?: string[] | string; email?: string } };
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
    }

    const type = event.type ?? "";
    const rawTo = event.data?.to ?? event.data?.email ?? [];
    const recipients = (Array.isArray(rawTo) ? rawTo : [rawTo]).filter(
      (e): e is string => typeof e === "string" && e.includes("@")
    );

    if (type === "email.bounced" || type === "email.complained") {
      const reason = type === "email.complained" ? "spam_complaint" : "hard_bounce";
      for (const email of recipients) {
        await suppressMarketing(email, reason, { source: "resend_webhook", actor: "provider:resend" });
        await recordAuditEvent({
          event: "provider_webhook",
          email: email.toLowerCase(),
          source: "resend",
          detail: type,
        });
      }
      console.log(`[webhooks/resend] ${type} — suppressed ${recipients.length} recipient(s)`);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/webhooks/resend]", err);
    // 500 so svix retries — suppression events must not be lost
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
