import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { createOrder, updateOrderStatus, listOrders, calcSubtotal, type OrderItem } from "@/lib/db";
import { sendCustomerOrderEmail, sendAdminOrderEmail } from "@/lib/order-emails";
import { createShipStationOrder } from "@/lib/shipstation";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://awakenbiolabs.com";
const QUIKLIE_BASE = "https://api.quiklie.com";

// ---------------------------------------------------------------------------
// POST /api/orders — create order and process payment
// paymentMethod "zelle" → save order + send Zelle instructions, no card processing
// paymentMethod "card"  → Quiklie S2S with 4% processing fee baked into total
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customer, shipping, items, notes,
      discountCode, discountAmount, shippingCost, processingFee, orderTotal,
      paymentMethod, // "card" | "zelle"
      card, // { number, holderName, expiryMonth, expiryYear, cvv }
    } = body ?? {};

    // Validate required fields
    if (
      !customer?.name || !customer?.email ||
      !shipping?.line1 || !shipping?.city || !shipping?.state || !shipping?.zip ||
      !items?.length
    ) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    if (paymentMethod === "card" && (!card?.number || !card?.holderName || !card?.expiryMonth || !card?.expiryYear || !card?.cvv)) {
      return NextResponse.json({ ok: false, error: "Card details are required" }, { status: 400 });
    }

    const typedItems = items as OrderItem[];
    const subtotal = calcSubtotal(typedItems);
    const refCode = req.cookies.get("awaken_ref")?.value || discountCode || undefined;

    // ── Zelle path ──────────────────────────────────────────────────────────
    if (paymentMethod === "zelle") {
      const order = await createOrder({
        customer,
        shipping,
        items: typedItems,
        subtotal,
        notes: notes || undefined,
        refCode,
        discountCode: discountCode || undefined,
        discountAmount: discountAmount || undefined,
        shippingCost: shippingCost || undefined,
        orderTotal: orderTotal || undefined,
        paymentMethod: "zelle",
      });

      // Send emails immediately — customer gets Zelle instructions
      await Promise.allSettled([
        sendCustomerOrderEmail(order),
        sendAdminOrderEmail(order),
      ]);

      console.log("[orders/zelle] Order created, awaiting Zelle payment:", order.id);
      return NextResponse.json({ ok: true, orderId: order.id, zelle: true });
    }

    // ── Card path (Quiklie S2S) ──────────────────────────────────────────────
    // 1. Save the order (pending_payment — confirmed only after Quiklie SUCCESS)
    const order = await createOrder({
      customer,
      shipping,
      items: typedItems,
      subtotal,
      notes: notes || undefined,
      refCode,
      discountCode: discountCode || undefined,
      discountAmount: discountAmount || undefined,
      shippingCost: shippingCost || undefined,
      processingFee: processingFee || undefined,
      orderTotal: orderTotal || undefined,
      paymentMethod: "card",
    });

    // 2. Build Quiklie payment request
    const apiKey = process.env.QUIKLIE_API_KEY;
    const merchantId = process.env.QUIKLIE_MERCHANT_ID;

    if (!apiKey || !merchantId) {
      console.error("[orders] QUIKLIE_API_KEY or QUIKLIE_MERCHANT_ID not set");
      return NextResponse.json({ ok: false, error: "Payment processor not configured. Please contact support." }, { status: 500 });
    }

    // Parse total amount (use orderTotal if available, else subtotal) — includes 4% fee
    const totalStr = orderTotal ?? subtotal;
    const amount = parseFloat(totalStr.replace(/[^0-9.]/g, "")) || 0;

    // Split full name into first/last
    const nameParts = customer.name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : nameParts[0];

    // Customer IP (Vercel passes this via x-forwarded-for)
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "0.0.0.0";

    // Strip spaces/dashes from card number
    const cardNumber = card.number.replace(/[\s-]/g, "");

    // Do NOT log card data — security requirement
    const quikliePayload = {
      merchantId,
      firstName,
      lastName,
      email: customer.email,
      phone: customer.phone || "0000000000",
      amount,
      currencyCode: "USD",
      address: shipping.line1,
      zipCode: shipping.zip,
      city: shipping.city,
      state: shipping.state,
      country: "US",
      ipAddress,
      callbackUrl: `${SITE}/api/webhooks/quiklie`,
      redirectUrl: `${SITE}/order-confirmation?id=${order.id}&method=card`,
      customerReferenceId: `CUST-${order.id}`,
      transactionReferenceId: order.id,
      cardNumber,
      cardHolderName: card.holderName,
      cardExpiryMonth: String(card.expiryMonth).padStart(2, "0"),
      cardExpiryYear: String(card.expiryYear),
      cardCvv: card.cvv,
      // midType omitted — let Quiklie use the default MID assigned to the merchant
    };

    // 3. Call Quiklie
    let quiklieData: Record<string, unknown>;
    try {
      const quiklieRes = await fetch(`${QUIKLIE_BASE}/api/v2/process-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "x-source": "api",
        },
        body: JSON.stringify(quikliePayload),
      });

      quiklieData = await quiklieRes.json();
      console.log("[orders/quiklie] full response:", JSON.stringify(quiklieData));
    } catch (fetchErr) {
      console.error("[orders/quiklie] network error:", fetchErr);
      return NextResponse.json({ ok: false, error: "Payment gateway unreachable. Please try again." }, { status: 502 });
    }

    const statusCode = Number(quiklieData.statusCode);
    const qkpaymentId = quiklieData.qkpaymentId as string | undefined;

    // Store Quiklie payment ID → orderId for webhook lookup
    if (qkpaymentId) {
      await kv.set(`quiklie:tx:${qkpaymentId}`, order.id, { ex: 60 * 60 * 48 });
      await kv.set(`quiklie:ref:${order.id}`, order.id, { ex: 60 * 60 * 48 });
    }

    // 4. Handle Quiklie response
    // statusCode 1 = SUCCESS
    if (statusCode === 1 || (quiklieData.status as string)?.toUpperCase() === "SUCCESS") {
      await updateOrderStatus(order.id, "paid");
      const paidOrder = { ...order, status: "paid" as const };
      createShipStationOrder(paidOrder).catch((e) => console.error("[quiklie] ShipStation:", e));
      await Promise.allSettled([
        sendCustomerOrderEmail(paidOrder),
        sendAdminOrderEmail(paidOrder),
      ]);
      return NextResponse.json({ ok: true, orderId: order.id, paid: true });
    }

    // statusCode 2 = 3DS required — redirect customer to Quiklie 3DS page
    if (statusCode === 2) {
      const redirectUrl = quiklieData.quikleeRedirectUrl as string;
      return NextResponse.json({ ok: true, orderId: order.id, requires3DS: true, redirectUrl });
    }

    // statusCode 3 = OTP required
    if (statusCode === 3) {
      return NextResponse.json({
        ok: true,
        orderId: order.id,
        requiresOTP: true,
        transactionId: qkpaymentId,
      });
    }

    // statusCode 5 = DECLINED
    if (statusCode === 5) {
      return NextResponse.json({
        ok: false,
        error: "Your card was declined. Please check your details or try a different card.",
      }, { status: 402 });
    }

    // statusCode 4 = PENDING (async — wait for webhook)
    if (statusCode === 4) {
      return NextResponse.json({ ok: true, orderId: order.id, pending: true });
    }

    // Unknown / error response
    const msg = (quiklieData.message as string) || "Payment could not be processed. Please try again.";
    console.error("[orders/quiklie] unexpected statusCode:", statusCode, quiklieData);
    return NextResponse.json({ ok: false, error: msg }, { status: 402 });

  } catch (err) {
    console.error("[POST /api/orders]", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// GET /api/orders — list all orders (admin only)
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const cookie = req.headers.get("cookie") ?? "";
  const token = cookie.match(/awaken_admin=([^;]+)/)?.[1];
  const expected = process.env.ADMIN_SESSION_TOKEN;
  if (!expected || token !== expected) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const orders = await listOrders();
  return NextResponse.json({ ok: true, orders });
}
