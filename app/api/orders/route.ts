import { NextResponse } from "next/server";
import { createOrder, listOrders, calcSubtotal, type OrderItem } from "@/lib/db";
import { sendCustomerOrderEmail, sendAdminOrderEmail } from "@/lib/order-emails";

// ---------------------------------------------------------------------------
// POST /api/orders — create new order
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customer, shipping, items, notes } = body ?? {};

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

    const order = await createOrder({
      customer,
      shipping,
      items: typedItems,
      subtotal,
      notes: notes || undefined,
    });

    // Fire both emails — non-blocking, don't fail the order if email errors
    Promise.allSettled([
      sendCustomerOrderEmail(order),
      sendAdminOrderEmail(order),
    ]).then((results) => {
      results.forEach((r) => {
        if (r.status === "rejected") console.error("[orders] email error:", r.reason);
      });
    });

    return NextResponse.json({ ok: true, orderId: order.id });
  } catch (err) {
    console.error("[POST /api/orders]", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// GET /api/orders — list all orders (admin only)
// ---------------------------------------------------------------------------
export async function GET(req: Request) {
  const cookie = req.headers.get("cookie") ?? "";
  const token = cookie.match(/awaken_admin=([^;]+)/)?.[1];
  const expected = process.env.ADMIN_SESSION_TOKEN;

  if (!expected || token !== expected) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const orders = await listOrders();
  return NextResponse.json({ ok: true, orders });
}
