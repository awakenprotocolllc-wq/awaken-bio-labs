import { NextRequest, NextResponse } from "next/server";
import { getOrder, updateOrderStatus, type OrderStatus } from "@/lib/db";
import { createShipStationOrder } from "@/lib/shipstation";
import { validateAdminSession } from "@/lib/admin-auth";
import { apiError } from "@/lib/api-error";

const VALID_STATUSES: OrderStatus[] = [
  "pending_payment",
  "paid",
  "fulfilled",
  "cancelled",
];



// PATCH /api/orders/[id] — update order status (admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!(await validateAdminSession(req.cookies.get("awaken_admin")?.value))) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { status } = (await req.json()) ?? {};

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ ok: false, error: "Invalid status" }, { status: 400 });
    }

    const updated = await updateOrderStatus(params.id, status as OrderStatus);
    if (!updated) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }

    if (status === "paid") {
      createShipStationOrder(updated).catch((err) =>
        console.error("[shipstation] push failed for", params.id, err)
      );
    }

    return NextResponse.json({ ok: true, order: updated });
  } catch (err) {
    return apiError("PATCH /api/orders/[id]", err);
  }
}
