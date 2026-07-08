import { NextRequest, NextResponse } from "next/server";
import { isOutOfStock, addRestockSubscriber, hasRestockSubscription } from "@/lib/stock-db";
import { getCustomerSession } from "@/lib/customer-db";
import { getProductBySlug } from "@/lib/products";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { apiError } from "@/lib/api-error";

// POST /api/stock/notify — subscribe the signed-in customer to a restock alert
// body: { slug: string }
// 401 when not signed in — the client uses this to prompt account creation.
export async function POST(req: NextRequest) {
  try {
    const { allowed } = await rateLimit(`stock-notify:${clientIp(req)}`, 20, 60 * 60);
    if (!allowed) {
      return NextResponse.json({ ok: false, error: "Too many requests. Try again later." }, { status: 429 });
    }

    const token = req.cookies.get("awaken_customer")?.value;
    const context = { ip: clientIp(req), ua: req.headers.get("user-agent") ?? "" };
    const customer = await getCustomerSession(token, context);
    if (!customer) {
      return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) ?? {};
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    if (!slug || slug.length > 100) {
      return NextResponse.json({ ok: false, error: "Invalid product" }, { status: 400 });
    }

    const product = getProductBySlug(slug);
    if (!product) {
      return NextResponse.json({ ok: false, error: "Unknown product" }, { status: 404 });
    }

    // Only allow subscriptions on products actually marked out of stock
    if (!(await isOutOfStock(slug))) {
      return NextResponse.json({ ok: false, error: "This product is currently in stock." }, { status: 409 });
    }

    const already = await hasRestockSubscription(slug, customer.id);
    if (!already) {
      await addRestockSubscriber(slug, customer.id);
    }

    return NextResponse.json({ ok: true, alreadySubscribed: already });
  } catch (err) {
    return apiError("POST /api/stock/notify", err);
  }
}
