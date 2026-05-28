import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { getOrder, updateOrderStatus } from "@/lib/db";
import { sendCustomerOrderEmail, sendAdminOrderEmail } from "@/lib/order-emails";
import { createShipStationOrder } from "@/lib/shipstation";

// ---------------------------------------------------------------------------
// POST /api/webhooks/quiklie
//
// Quiklie sends the final payment status here (callbackUrl in payment request).
//
// Security: Quiklie includes the merchant API key in the X-API-Key header.
// We validate it matches QUIKLIE_API_KEY before processing.
//
// Sample payload:
// {
//   "amount": 50.0,
//   "status": "SUCCESS",
//   "statusCode": "SUCCESS",
//   "message": "Payment completed successfully.",
//   "currency": "USD",
//   "transactionId": "QKP-4017946200",
//   "customerReferenceId": "CUST-<orderId>",
//   "transactionReferenceId": "<orderId>"
// }
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[quiklie/webhook] received:", JSON.stringify(body).slice(0, 500));

    // Validate API key
    const incomingKey = req.headers.get("x-api-key") ?? req.headers.get("X-API-Key") ?? "";
    const expectedKey = process.env.QUIKLIE_API_KEY ?? "";
    if (!expectedKey || incomingKey !== expectedKey) {
      console.warn("[quiklie/webhook] Invalid API key");
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const status = (body.status as string)?.toUpperCase();
    const statusCode = String(body.statusCode ?? "").toUpperCase();

    const isSuccess = status === "SUCCESS" || statusCode === "SUCCESS" || statusCode === "1";

    if (!isSuccess) {
      console.log("[quiklie/webhook] Non-success status:", status, statusCode);
      return NextResponse.json({ ok: true, skipped: true });
    }

    // Resolve orderId — check multiple fields
    const transactionId = body.transactionId as string | undefined;
    const customerRef = body.customerReferenceId as string | undefined; // "CUST-<orderId>"
    const txRef = body.transactionReferenceId as string | undefined;    // = orderId directly

    let orderId: string | null = null;

    // transactionReferenceId is the orderId we passed directly
    if (txRef) orderId = txRef;

    // customerReferenceId is "CUST-<orderId>"
    if (!orderId && customerRef?.startsWith("CUST-")) {
      orderId = customerRef.slice(5);
    }

    // Fall back to KV lookup by Quiklie transaction ID
    if (!orderId && transactionId) {
      orderId = await kv.get<string>(`quiklie:tx:${transactionId}`);
    }

    if (!orderId) {
      console.error("[quiklie/webhook] Could not resolve orderId:", body);
      return NextResponse.json({ ok: false, error: "Order not found" });
    }

    const order = await getOrder(orderId);
    if (!order) {
      console.error("[quiklie/webhook] Order not in KV:", orderId);
      return NextResponse.json({ ok: false, error: "Order missing from database" });
    }

    // Idempotency guard
    if (order.status === "paid" || order.status === "fulfilled") {
      console.log("[quiklie/webhook] Already processed:", orderId);
      return NextResponse.json({ ok: true, skipped: true });
    }

    // Mark paid, push to ShipStation, send emails
    await updateOrderStatus(orderId, "paid");
    const paidOrder = { ...order, status: "paid" as const };

    createShipStationOrder(paidOrder).catch((e) =>
      console.error("[quiklie/webhook] ShipStation:", e)
    );

    await Promise.allSettled([
      sendCustomerOrderEmail(paidOrder),
      sendAdminOrderEmail(paidOrder),
    ]);

    // Clean up KV lookup keys
    if (transactionId) kv.del(`quiklie:tx:${transactionId}`).catch(() => {});

    console.log("[quiklie/webhook] Order confirmed paid:", orderId);
    return NextResponse.json({ ok: true, orderId });

  } catch (err) {
    console.error("[POST /api/webhooks/quiklie]", err);
    return NextResponse.json({ ok: false, error: "Server error" });
  }
}
