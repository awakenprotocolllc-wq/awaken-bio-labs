import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { getOrder, updateOrderStatus } from "@/lib/db";
import { createShipStationOrder } from "@/lib/shipstation";
import { sendCustomerOrderEmail, sendAdminOrderEmail } from "@/lib/order-emails";
import { createHmac } from "crypto";

// ---------------------------------------------------------------------------
// POST /api/webhooks/psifi
//
// PsiFi uses Svix for webhook delivery.
// Configure in: portal.psifi.app/developer → Webhooks → New Endpoint
//   URL:    https://awakenbiolabs.com/api/webhooks/psifi
//   Events: transaction.completed, checkout.notifications.complete
//
// Svix signs with three headers:
//   svix-id        — unique message ID
//   svix-timestamp — Unix timestamp (seconds)
//   svix-signature — "v1,<base64-hmac-sha256>" of "{id}.{timestamp}.{body}"
// ---------------------------------------------------------------------------

function verifySvixSignature(
  rawBody: string,
  msgId: string,
  msgTimestamp: string,
  msgSignature: string,
  secret: string
): boolean {
  try {
    // Reject if timestamp is more than 5 minutes old (replay protection)
    const ts = parseInt(msgTimestamp, 10);
    if (isNaN(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false;

    // Svix signing: HMAC-SHA256 of "{svix-id}.{svix-timestamp}.{rawBody}"
    const toSign = `${msgId}.${msgTimestamp}.${rawBody}`;

    // Secret may be prefixed with "whsec_" — strip it, then base64-decode
    const cleanSecret = secret.startsWith("whsec_") ? secret.slice(6) : secret;
    const keyBytes = Buffer.from(cleanSecret, "base64");
    const computedHmac = createHmac("sha256", keyBytes).update(toSign).digest("base64");

    // svix-signature header: "v1,<base64sig>" (may have multiple space-separated sigs)
    const sigs = msgSignature.split(" ");
    return sigs.some((s) => {
      const b64 = s.startsWith("v1,") ? s.slice(3) : s;
      return b64 === computedHmac;
    });
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Log full payload for debugging (truncated)
  console.log("[psifi/webhook] received:", rawBody.slice(0, 800));

  // Svix signature headers
  const msgId        = req.headers.get("svix-id") ?? "";
  const msgTimestamp = req.headers.get("svix-timestamp") ?? "";
  const msgSignature = req.headers.get("svix-signature") ?? "";

  const webhookSecret = process.env.PSIFI_WEBHOOK_SECRET;
  if (webhookSecret) {
    if (!msgId || !msgTimestamp || !msgSignature) {
      console.warn("[psifi/webhook] Missing Svix headers");
      return NextResponse.json({ ok: false, error: "Missing signature headers" }, { status: 401 });
    }
    if (!verifySvixSignature(rawBody, msgId, msgTimestamp, msgSignature, webhookSecret)) {
      console.warn("[psifi/webhook] Svix signature verification failed");
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
    }
  } else {
    console.warn("[psifi/webhook] No PSIFI_WEBHOOK_SECRET set — skipping verification");
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  // PsiFi event types we handle:
  //   transaction.completed          — card payment confirmed
  //   checkout.notifications.complete — checkout session completed
  const eventType = (body.type as string) ?? "";

  const isPaymentComplete =
    eventType === "transaction.completed" ||
    eventType === "checkout.notifications.complete";

  if (!isPaymentComplete) {
    console.log("[psifi/webhook] Skipping non-payment event:", eventType || body.status);
    return NextResponse.json({ ok: true, skipped: true });
  }

  // Svix wraps the PsiFi payload in { type, data: { ... } }
  const data = (body.data as Record<string, unknown>) ?? {};

  // Session/transaction ID — PsiFi may use different field names
  const sessionId =
    (data.checkoutSessionId as string) ??
    (data.checkout_session_id as string) ??
    (data.sessionId as string) ??
    (data.session_id as string) ??
    (data.id as string) ??
    "";

  // orderId — check metadata first (we pass it when creating the session),
  // then fall back to KV session map
  let orderId: string | null = null;

  const metadata =
    (data.metadata as Record<string, string>) ??
    (body.metadata as Record<string, string>) ??
    {};

  if (metadata?.orderId) {
    orderId = metadata.orderId;
  } else if (sessionId) {
    orderId = await kv.get<string>(`psifi:session:${sessionId}`);
  }

  if (!orderId) {
    console.error("[psifi/webhook] Could not resolve orderId. Session:", sessionId, "Body:", body);
    // Return 200 so PsiFi doesn't keep retrying — this is a data issue we need to fix manually
    return NextResponse.json({ ok: false, error: "Order not found" });
  }

  // Fetch the order
  const order = await getOrder(orderId);
  if (!order) {
    console.error("[psifi/webhook] Order not found in KV:", orderId);
    return NextResponse.json({ ok: false, error: "Order not found in database" });
  }

  // Idempotency — skip if already paid (webhook may fire more than once)
  if (order.status === "paid" || order.status === "fulfilled") {
    console.log("[psifi/webhook] Order already paid/fulfilled, skipping:", orderId);
    return NextResponse.json({ ok: true, skipped: true });
  }

  // Mark order as paid
  await updateOrderStatus(orderId, "paid");
  console.log("[psifi/webhook] Order marked paid:", orderId);

  // Push to ShipStation for fulfillment
  const paidOrder = { ...order, status: "paid" as const };
  createShipStationOrder(paidOrder).catch((err) =>
    console.error("[psifi/webhook] ShipStation push failed for", orderId, err)
  );

  // Send confirmation emails
  try {
    await Promise.allSettled([
      sendCustomerOrderEmail(paidOrder),
      sendAdminOrderEmail(paidOrder),
    ]);
  } catch (emailErr) {
    console.error("[psifi/webhook] Email send failed:", emailErr);
  }

  // Clean up session mapping
  if (sessionId) {
    kv.del(`psifi:session:${sessionId}`).catch(() => {});
  }

  return NextResponse.json({ ok: true, orderId });
}
