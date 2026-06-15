import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession, getCustomerPaymentDisplay } from "@/lib/customer-db";
import { clientIp } from "@/lib/rate-limit";
import { apiError } from "@/lib/api-error";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("awaken_customer")?.value;
    const context = { ip: clientIp(req), ua: req.headers.get("user-agent") ?? "" };
    const customer = await getCustomerSession(token, context);

    if (!customer) return NextResponse.json({ ok: false }, { status: 401 });

    const savedPayment = await getCustomerPaymentDisplay(customer.id);

    // Strip adminNote — internal field, must not be visible to the customer
    const { adminNote: _adminNote, ...customerPublic } = customer;
    return NextResponse.json({ ok: true, customer: customerPublic, savedPayment });
  } catch (err) {
    return apiError("customer:me", err);
  }
}
