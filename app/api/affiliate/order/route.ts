import { NextRequest, NextResponse } from "next/server";
import { getAffiliateSession } from "@/lib/affiliate-db";
import { createOrder, calcSubtotal } from "@/lib/db";
import { products, getPriceForStrength } from "@/lib/products";
import { rateLimit, rateLimitBurst, clientIp } from "@/lib/rate-limit";
import { apiError } from "@/lib/api-error";

const AFFILIATE_DISCOUNT = 0.30; // 30% off retail

function parsePrice(price: string): number {
  const n = parseFloat(price.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function applyDiscount(retailPrice: string): string {
  const retail = parsePrice(retailPrice);
  return `$${(retail * (1 - AFFILIATE_DISCOUNT)).toFixed(2)}`;
}

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);

    const { allowed: hourlyOk } = await rateLimit(`aff:order:${ip}`, 10, 60 * 60);
    if (!hourlyOk) return NextResponse.json({ ok: false, error: "Too many requests. Try again later." }, { status: 429 });

    const { allowed: burstOk } = await rateLimitBurst(`aff:order:${ip}`);
    if (!burstOk) return NextResponse.json({ ok: false, error: "Too many requests. Slow down." }, { status: 429 });

    const token = req.cookies.get("awaken_affiliate")?.value;
    if (!token) return NextResponse.json({ ok: false, error: "Not authenticated." }, { status: 401 });

    const account = await getAffiliateSession(token, { ip, ua: req.headers.get("user-agent") ?? "" });
    if (!account) return NextResponse.json({ ok: false, error: "Session expired. Please log in again." }, { status: 401 });
    if (account.status !== "active") return NextResponse.json({ ok: false, error: "Your account is not active." }, { status: 403 });

    const body = await req.json();
    const { items, shipping, notes } = body ?? {};

    // Validate shipping
    if (
      typeof shipping?.line1 !== "string" || !shipping.line1.trim() ||
      typeof shipping?.city  !== "string" || !shipping.city.trim()  ||
      typeof shipping?.state !== "string" || !shipping.state.trim() ||
      typeof shipping?.zip   !== "string" || !shipping.zip.trim()
    ) {
      return NextResponse.json({ ok: false, error: "Complete shipping address is required." }, { status: 400 });
    }
    if (
      shipping.line1.length > 200 || shipping.city.length > 100 ||
      shipping.state.length > 50  || shipping.zip.length > 20
    ) {
      return NextResponse.json({ ok: false, error: "Shipping address fields are too long." }, { status: 400 });
    }

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ ok: false, error: "Cart is empty." }, { status: 400 });
    }
    if (items.length > 50) {
      return NextResponse.json({ ok: false, error: "Too many line items." }, { status: 400 });
    }

    // Resolve and price each item server-side — never trust client prices
    const resolvedItems = [];
    for (const item of items) {
      const { product: productName, strength, qty } = item ?? {};
      if (typeof productName !== "string" || typeof strength !== "string") {
        return NextResponse.json({ ok: false, error: "Invalid item format." }, { status: 400 });
      }
      const qty_ = parseInt(String(qty), 10);
      if (isNaN(qty_) || qty_ < 1 || qty_ > 99) {
        return NextResponse.json({ ok: false, error: `Invalid quantity for ${productName}.` }, { status: 400 });
      }

      const product = products.find((p) => p.name === productName);
      if (!product) {
        return NextResponse.json({ ok: false, error: `Unknown product: ${productName}.` }, { status: 400 });
      }
      if (!product.strengths.includes(strength)) {
        return NextResponse.json({ ok: false, error: `Invalid strength for ${productName}.` }, { status: 400 });
      }
      const retailPrice = getPriceForStrength(product, strength);
      if (!retailPrice || retailPrice === "Contact Seller" || retailPrice.includes("–")) {
        return NextResponse.json({ ok: false, error: `${productName} is not available for online order.` }, { status: 400 });
      }

      resolvedItems.push({
        product: product.name,
        strength,
        price: applyDiscount(retailPrice), // 30% off — computed server-side
        qty: qty_,
      });
    }

    const subtotal = calcSubtotal(resolvedItems);

    const order = await createOrder({
      customer: { name: account.name, email: account.email },
      shipping: {
        line1: shipping.line1.trim(),
        city:  shipping.city.trim(),
        state: shipping.state.trim(),
        zip:   shipping.zip.trim(),
      },
      items: resolvedItems,
      subtotal,
      orderTotal: subtotal, // no additional fees for affiliate orders
      paymentMethod: "card",
      notes: typeof notes === "string" ? notes.slice(0, 500) : undefined,
      orderSource: "affiliate",
      affiliateId: account.id,
      affiliateOrderType: account.programType,
    });

    return NextResponse.json({ ok: true, orderId: order.id });
  } catch (err) {
    return apiError("POST /api/affiliate/order", err);
  }
}
