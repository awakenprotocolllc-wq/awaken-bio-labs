import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { getOrder, updateOrderStatus } from "@/lib/db";
import { createShipStationOrder } from "@/lib/shipstation";
import { sendCustomerOrderEmail, sendAdminOrderEmail } from "@/lib/order-emails";
import { createHmac } from "crypto";

// ---------------------------------------------------------------------------
// POST /api/webhooks/psifi
//
// PsiFi fires this when a payment is completed.
// Configure in: portal.psifi.app/developer → Webhooks
// URL: https://awakenbiolabs.com/api/webhooks/psifi
//
// We:
//  1. Verify the webhook signature (if PSIFI_WEBHOOK_SECRET is set)
//  2. Identify the order from session ID or metadata
//  3. Mark the order as "paid"
//  4. Push to ShipStation for fulfillment
//  5. Send confirmation emails to customer + admin
// ---------------------------------------------------------------------------

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  // PsiFi likely uses HMAC-SHA256 — try common header/format patterns
  try {
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    // Handle both plain hex and "sha256=..." prefixed formats
    const clean = signature.startsWith("sha256=") ? signature.slice(7) : signature;
    return clean === expected;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Log full payload for the first few calls so you can inspect the format
  console.log("[psifi/webhook] received:", rawBody.slice(0, 1000));

  // Verify signature if secret is configured
  const webhookSecret = process.env.PSIFI_WEBHOOK_SECRET;
  if (webhookSecret) {
    const sig =
      req.headers.get("x-psifi-signature") ??
      req.headers.get("x-signature") ??
      req.headers.get("webhook-signature") ??
      "";
    if (!sig || !verifySignature(rawBody, sig, webhookSecret)) {
      console.warn("[psifi/webhook] Signature verification failed — check PSIFI_WEBHOOK_SECRET");
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
    }
  } else {
    console.warn("[psifi/webhook] No PSIFI_WEBHOOK_SECRET set — skipping signature verification");
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  // Extract event type — handle multiple payload formats
  const eventType =
    (body.type as string) ??
    (body.event as string) ??
    (body.event_type as string) ??
    "";

  // Only process successful payment events
  const isPaymentComplete =
    eventType === "payment.completed" ||
    eventType === "checkout.completed" ||
    eventType === "payment_intent.succeeded" ||
    eventType === "session.completed" ||
    (body.status as string) === "paid" ||
    ((body.data as Record<string, unknown>)?.status as string) === "paid" ||
    ((body.data as Record<string, unknown>)?.status as string) === "completed";

  if (!isPaymentComplete) {
    console.log("[psifi/webhook] Skipping non-payment event:", eventType || body.status);
    return NextResponse.json({ ok: true, skipped: true });
  }

  // Extract session ID from multiple possible locations in the payload
  const data = (body.data as Record<string, unknown>) ?? {};
  const sessionId =
    (data.id as string) ??
    (data.session_id as string) ??
    (data.checkout_session_id as string) ??
    (body.session_id as string) ??
    (body.id as string) ??
    "";

  // Extract orderId — check metadata first, then KV session map
  let orderId: string | null = null;

  const metadata = (data.metadata as Record<string, string>) ?? (body.metadata as Record<string, string>) ?? {};
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
