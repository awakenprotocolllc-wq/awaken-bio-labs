import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession, getCustomerOrderIds } from "@/lib/customer-db";
import { getOrder } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";
import { apiError } from "@/lib/api-error";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("awaken_customer")?.value;
    const context = { ip: clientIp(req), ua: req.headers.get("user-agent") ?? "" };
    const customer = await getCustomerSession(token, context);
    if (!customer) return NextResponse.json({ ok: false }, { status: 401 });

    const ids = await getCustomerOrderIds(customer.id);
    const orders = (await Promise.all(ids.map((id) => getOrder(id)))).filter(Boolean);

    return NextResponse.json({ ok: true, orders });
  } catch (err) {
    return apiError("customer:orders", err);
  }
}
