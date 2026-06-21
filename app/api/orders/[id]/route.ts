import { NextRequest, NextResponse } from "next/server";
import { getOrder, updateOrderStatus, applyAffiliateCodeToOrder, type OrderStatus } from "@/lib/db";
import { getAffiliateByCode } from "@/lib/affiliate-db";
import { createShipStationOrder } from "@/lib/shipstation";
import { validateAdminSession } from "@/lib/admin-auth";
import { apiError } from "@/lib/api-error";
import { sendDiscountAppliedEmail } from "@/lib/order-emails";

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

    const body = (await req.json()) ?? {};

    // ── Apply affiliate code retroactively ───────────────────────────────────
    if (body.applyCode !== undefined) {
      const code = String(body.applyCode).trim().toUpperCase();
      if (!code) {
        return NextResponse.json({ ok: false, error: "Code is required" }, { status: 400 });
      }
      if (code.length > 50) {
        return NextResponse.json({ ok: false, error: "Invalid code" }, { status: 400 });
      }

      // Guard: load the order first so we can reject if a code is already applied
      const existingOrder = await getOrder(params.id);
      if (!existingOrder) {
        return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
      }
      if (existingOrder.discountCode) {
        return NextResponse.json({ ok: false, error: "A discount code has already been applied to this order" }, { status: 409 });
      }

      const affiliate = await getAffiliateByCode(code);
      if (!affiliate || affiliate.status !== "active") {
        return NextResponse.json({ ok: false, error: "Affiliate code not found or inactive" }, { status: 404 });
      }

      const updated = await applyAffiliateCodeToOrder(params.id, code, affiliate.discountRate);
      if (!updated) {
        return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
      }

      sendDiscountAppliedEmail(updated).catch((err) =>
        console.error("[email] discount-applied email failed for", params.id, err)
      );

      return NextResponse.json({ ok: true, order: updated });
    }

    // ── Update status ────────────────────────────────────────────────────────
    const { status } = body;

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

    return NextResponse.json({ ok: true, order: { id: updated.id, status: updated.status } });
  } catch (err) {
    return apiError("PATCH /api/orders/[id]", err);
  }
}
