import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer-db";
import { recordCartActivity, type AcrItem } from "@/lib/abandoned-cart";
import { products } from "@/lib/products";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { apiError } from "@/lib/api-error";

// POST /api/cart/sync — mirror the authenticated customer's client-side cart
// to the server for abandoned-cart tracking. Guests get a 401 and are never
// tracked. The cart is keyed by the SESSION's customer ID — the client cannot
// name a cart or customer, so cross-customer access is structurally impossible.
export async function POST(req: NextRequest) {
  try {
    const { allowed } = await rateLimit(`cart-sync:${clientIp(req)}`, 120, 60 * 60);
    if (!allowed) {
      return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });
    }

    const token = req.cookies.get("awaken_customer")?.value;
    const context = { ip: clientIp(req), ua: req.headers.get("user-agent") ?? "" };
    const customer = await getCustomerSession(token, context);
    if (!customer) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) ?? {};
    const rawItems = Array.isArray(body.items) ? body.items : [];
    if (rawItems.length > 20) {
      return NextResponse.json({ ok: false, error: "Too many items" }, { status: 400 });
    }

    // Validate against the catalog; ignore anything unrecognizable
    const items: AcrItem[] = [];
    for (const raw of rawItems) {
      const product = typeof raw?.product === "string" ? raw.product : "";
      const strength = typeof raw?.strength === "string" ? raw.strength : "";
      const price = typeof raw?.price === "string" ? raw.price.slice(0, 20) : "";
      const qty = Number.isInteger(raw?.qty) && raw.qty >= 1 && raw.qty <= 99 ? raw.qty : 0;
      if (!product || !strength || !qty) continue;
      if (!products.some((p) => p.name === product)) continue;
      items.push({ product, strength, price, qty });
    }

    await recordCartActivity(customer.id, items);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError("POST /api/cart/sync", err);
  }
}
