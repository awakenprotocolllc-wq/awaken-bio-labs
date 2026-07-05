import { NextRequest, NextResponse } from "next/server";
import { getOrder } from "@/lib/db";
import { sendCustomerOrderEmail } from "@/lib/order-emails";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { apiError } from "@/lib/api-error";

// POST /api/orders/resend-email
// Customer-facing — no auth, but rate limited and gated by order ID + email match.
// Allows a customer to resend their own confirmation/Zelle-instructions email.
export async function POST(req: NextRequest) {
  try {
    // 3 resend attempts per IP per hour
    const { allowed } = await rateLimit(`resend-email:${clientIp(req)}`, 3, 60 * 60);
    if (!allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many requests. Please wait before trying again." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const orderId = typeof body.orderId === "string" ? body.orderId.trim().toLowerCase() : "";
    const email   = typeof body.email   === "string" ? body.email.trim().toLowerCase()   : "";

    if (!orderId || orderId.length > 50) {
      return NextResponse.json({ ok: false, error: "Invalid order ID." }, { status: 400 });
    }
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "Invalid email address." }, { status: 400 });
    }

    const order = await getOrder(orderId);

    // Verify the supplied email matches the order — prevents using someone else's
    // order ID to spam a third party, and avoids leaking order existence on mismatch.
    if (!order || order.customer.email !== email) {
      return NextResponse.json(
        { ok: false, error: "No order found matching that ID and email address." },
        { status: 404 }
      );
    }

    const result = await sendCustomerOrderEmail(order);
    if (!result.ok && !result.fallback) {
      console.error("[resend-email] Delivery failed for order", orderId, result.error);
      return NextResponse.json(
        { ok: false, error: "Email could not be delivered. Please contact support@awakenbiolabs.com." },
        { status: 502 }
      );
    }

    console.log("[resend-email] Resent confirmation for order", orderId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError("POST /api/orders/resend-email", err);
  }
}
