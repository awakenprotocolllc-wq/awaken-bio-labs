import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { createOrder, listOrders, calcSubtotal, type OrderItem } from "@/lib/db";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://awakenbiolabs.com";

// ---------------------------------------------------------------------------
// POST /api/orders — create order then redirect to PsiFi checkout
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customer, shipping, items, notes, discountCode, discountAmount, shippingCost, orderTotal } = body ?? {};

    // Validate required fields
    if (
      !customer?.name ||
      !customer?.email ||
      !shipping?.line1 ||
      !shipping?.city ||
      !shipping?.state ||
      !shipping?.zip ||
      !items?.length
    ) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const typedItems = items as OrderItem[];
    const subtotal = calcSubtotal(typedItems);

    // Referral attribution: cookie ref takes priority; discount code used as fallback
    const refCode = req.cookies.get("awaken_ref")?.value || discountCode || undefined;

    // 1. Save the order (pending_payment — no emails yet, payment not confirmed)
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
    });

    // 2. Build PsiFi line items
    function parseAmt(s?: string): number {
      if (!s) return 0;
      return parseFloat(s.replace(/[^0-9.]/g, "")) || 0;
    }

    const psifiItems: { name: string; price: number; quantity: number }[] = typedItems.map((item) => ({
      name: `${item.product} — ${item.strength}`,
      price: parseAmt(item.price),
      quantity: item.qty,
    }));

    // Shipping line item
    const shippingNum = parseAmt(shippingCost);
    if (shippingNum > 0) {
      psifiItems.push({ name: "Shipping — UPS 2-Day", price: shippingNum, quantity: 1 });
    }

    // Discount line item (negative price — reduces total on PsiFi checkout)
    const discountNum = parseAmt(discountAmount);
    if (discountNum > 0) {
      psifiItems.push({
        name: `Discount${discountCode ? ` — ${discountCode}` : ""}`,
        price: -discountNum,
        quantity: 1,
      });
    }

    // 3. Create PsiFi checkout session
    const apiKey = process.env.PSIFI_API_KEY;
    if (!apiKey) {
      // Fallback: no PsiFi key configured — send to order confirmation directly
      // (useful for local dev; in production this should never happen)
      console.warn("[orders] PSIFI_API_KEY not set — skipping payment redirect");
      return NextResponse.json({ ok: true, orderId: order.id, checkout_url: null });
    }

    const psifiRes = await fetch("https://api.psifi.app/api/v2/checkout-sessions", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: psifiItems,
        success_url: `${SITE}/order-confirmation?id=${order.id}`,
        cancel_url: `${SITE}/checkout`,
        // Pass metadata so PsiFi echoes it back in the webhook
        metadata: { orderId: order.id },
      }),
    });

    if (!psifiRes.ok) {
      const errText = await psifiRes.text();
      console.error("[orders] PsiFi session creation failed:", psifiRes.status, errText);
      // Don't fail the whole order — return orderId so customer can at least see confirmation
      return NextResponse.json({ ok: true, orderId: order.id, checkout_url: null });
    }

    const psifiData = await psifiRes.json();
    const checkoutUrl: string = psifiData.checkout_url ?? psifiData.url ?? psifiData.checkoutUrl;
    const sessionId: string = psifiData.id ?? psifiData.session_id ?? psifiData.sessionId;

    // 4. Store session → orderId mapping for webhook lookup (48h TTL)
    if (sessionId) {
      await kv.set(`psifi:session:${sessionId}`, order.id, { ex: 60 * 60 * 48 });
    }

    return NextResponse.json({ ok: true, orderId: order.id, checkout_url: checkoutUrl });
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
