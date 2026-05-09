import { NextResponse } from "next/server";
import { updateOrderStatus, type OrderStatus } from "@/lib/db";

const VALID_STATUSES: OrderStatus[] = [
  "pending_payment",
  "paid",
  "fulfilled",
  "cancelled",
];

// PATCH /api/orders/[id] — update order status (admin only)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const cookie = req.headers.get("cookie") ?? "";
  const token = cookie.match(/awaken_admin=([^;]+)/)?.[1];
  const expected = process.env.ADMIN_SESSION_TOKEN;

  if (!expected || token !== expected) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { status } = (await req.json()) ?? {};

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { ok: false, error: "Invalid status" },
      { status: 400 }
    );
  }

  const updated = await updateOrderStatus(params.id, status as OrderStatus);
  if (!updated) {
    return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, order: updated });
}
