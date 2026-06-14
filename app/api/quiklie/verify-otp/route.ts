import { NextRequest, NextResponse } from "next/server";
import { getOrder, updateOrderStatus } from "@/lib/db";
import { sendCustomerOrderEmail, sendAdminOrderEmail } from "@/lib/order-emails";
import { createShipStationOrder } from "@/lib/shipstation";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { apiError } from "@/lib/api-error";

// POST /api/quiklie/verify-otp
// Called from CheckoutForm when Quiklie returns statusCode 3 (OTP required)
// body: { transactionId: string; otp: string; orderId: string }
export async function POST(req: NextRequest) {
  try {
    // 5 OTP attempts per minute per IP
    const { allowed } = await rateLimit(`verify-otp:${clientIp(req)}`, 5, 60);
    if (!allowed) {
      return NextResponse.json({ ok: false, error: "Too many attempts. Please wait a moment." }, { status: 429 });
    }

    const { transactionId, otp, orderId } = await req.json();

    if (!transactionId || !otp || !orderId) {
      return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
    }
    if (!/^\d{4,8}$/.test(String(otp).trim())) {
      return NextResponse.json({ ok: false, error: "Invalid OTP format" }, { status: 400 });
    }
    if (typeof transactionId !== "string" || transactionId.length > 100) {
      return NextResponse.json({ ok: false, error: "Invalid transaction ID" }, { status: 400 });
    }
    if (typeof orderId !== "string" || orderId.length > 50) {
      return NextResponse.json({ ok: false, error: "Invalid order ID" }, { status: 400 });
    }

    const apiKey = process.env.QUIKLIE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "Payment not configured" }, { status: 500 });
    }

    // Call Quiklie OTP verification
    const res = await fetch("https://api.quiklie.com/api/v1/verify-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "x-source": "api",
      },
      body: JSON.stringify({ transactionId, otp }),
    });

    const data = await res.json();
    console.log("[verify-otp] response:", data.approved, data.status);

    if (!data.approved) {
      return NextResponse.json({
        ok: false,
        error: "Incorrect OTP. Please try again.",
      }, { status: 402 });
    }

    // OTP approved — mark order paid, push to ShipStation, send emails
    const order = await getOrder(orderId);
    if (!order) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "paid" && order.status !== "fulfilled") {
      await updateOrderStatus(orderId, "paid");
      const paidOrder = { ...order, status: "paid" as const };
      createShipStationOrder(paidOrder).catch((e) => console.error("[verify-otp] ShipStation:", e));
      await Promise.allSettled([
        sendCustomerOrderEmail(paidOrder),
        sendAdminOrderEmail(paidOrder),
      ]);
    }

    return NextResponse.json({ ok: true, orderId });
  } catch (err) {
    return apiError("POST /api/quiklie/verify-otp", err);
  }
}
