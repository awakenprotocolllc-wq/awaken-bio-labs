import { NextRequest, NextResponse } from "next/server";
import { validateAdminSession } from "@/lib/admin-auth";
import { listCustomers, getCustomerById, getCustomerOrderIds, updateCustomer } from "@/lib/customer-db";
import { getOrder } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";
import { apiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("awaken_admin")?.value;
    const context = { ip: clientIp(req), ua: req.headers.get("user-agent") ?? "" };
    if (!(await validateAdminSession(token, context))) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const customers = await listCustomers();

    // Attach summary stats: total orders and spend per customer
    const enriched = await Promise.all(customers.map(async (c) => {
      const orderIds = await getCustomerOrderIds(c.id);
      const orders = (await Promise.all(orderIds.map((id) => getOrder(id)))).filter(Boolean);
      const totalSpend = orders.reduce((sum, o) => {
        const n = parseFloat((o!.orderTotal ?? o!.subtotal).replace(/[^0-9.]/g, ""));
        return sum + (isNaN(n) ? 0 : n);
      }, 0);
      const lastOrderAt = orders.length > 0 ? orders[0]!.createdAt : null;
      return { ...c, orderCount: orders.length, totalSpend, lastOrderAt };
    }));

    return NextResponse.json({ ok: true, customers: enriched });
  } catch (err) {
    return apiError("admin:customers", err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = req.cookies.get("awaken_admin")?.value;
    const context = { ip: clientIp(req), ua: req.headers.get("user-agent") ?? "" };
    if (!(await validateAdminSession(token, context))) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    const body = await req.json();
    const { customerId, adminNote } = body;
    if (!customerId) return NextResponse.json({ ok: false, error: "customerId required." }, { status: 400 });
    const updated = await updateCustomer(customerId, { adminNote });
    return NextResponse.json({ ok: true, customer: updated });
  } catch (err) {
    return apiError("admin:customers", err);
  }
}
