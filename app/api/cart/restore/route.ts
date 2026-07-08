import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer-db";
import { getAbandonedCart } from "@/lib/abandoned-cart";
import { recordAuditEvent } from "@/lib/marketing-consent";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { apiError } from "@/lib/api-error";

// GET /api/cart/restore — return the authenticated customer's own server-side
// cart snapshot (for cross-device return from a reminder email). Ownership is
// enforced by deriving the customer ID from the session; no ID parameter is
// accepted, so a tampered URL cannot reference another customer's cart.
//
// Optional ?src=r1|r2|r3 records which reminder stage the click came from.
export async function GET(req: NextRequest) {
  try {
    const { allowed } = await rateLimit(`cart-restore:${clientIp(req)}`, 60, 60 * 60);
    if (!allowed) {
      return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });
    }

    const token = req.cookies.get("awaken_customer")?.value;
    const context = { ip: clientIp(req), ua: req.headers.get("user-agent") ?? "" };
    const customer = await getCustomerSession(token, context);
    if (!customer) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    // Reminder click attribution (best-effort analytics, never blocks)
    const src = req.nextUrl.searchParams.get("src") ?? "";
    if (/^r[1-3]$/.test(src)) {
      await recordAuditEvent({
        event: "acr_click",
        email: customer.email.toLowerCase(),
        source: "abandoned_cart",
        detail: `stage ${src.slice(1)} return click`,
      });
    }

    const record = await getAbandonedCart(customer.id);
    const items = record && (record.status === "active" || record.status === "completed_sequence")
      ? record.items
      : [];

    return NextResponse.json({ ok: true, items });
  } catch (err) {
    return apiError("GET /api/cart/restore", err);
  }
}
