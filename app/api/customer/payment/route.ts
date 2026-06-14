import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession, saveCustomerPayment, deleteCustomerPayment } from "@/lib/customer-db";
import { clientIp } from "@/lib/rate-limit";
import { apiError } from "@/lib/api-error";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("awaken_customer")?.value;
    const context = { ip: clientIp(req), ua: req.headers.get("user-agent") ?? "" };
    const customer = await getCustomerSession(token, context);
    if (!customer) return NextResponse.json({ ok: false }, { status: 401 });

    const body = await req.json();
    const { number, holderName, expiryMonth, expiryYear, cvv } = body;
    if (!number || !holderName || !expiryMonth || !expiryYear || !cvv) {
      return NextResponse.json({ ok: false, error: "All card fields are required." }, { status: 400 });
    }

    const display = await saveCustomerPayment(customer.id, { number, holderName, expiryMonth, expiryYear, cvv });
    return NextResponse.json({ ok: true, payment: display });
  } catch (err) {
    return apiError("customer:payment", err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get("awaken_customer")?.value;
    const context = { ip: clientIp(req), ua: req.headers.get("user-agent") ?? "" };
    const customer = await getCustomerSession(token, context);
    if (!customer) return NextResponse.json({ ok: false }, { status: 401 });

    await deleteCustomerPayment(customer.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError("customer:payment", err);
  }
}
