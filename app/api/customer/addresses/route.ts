import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession, saveAddress, deleteAddress, setDefaultAddress } from "@/lib/customer-db";
import { clientIp } from "@/lib/rate-limit";
import { apiError } from "@/lib/api-error";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("awaken_customer")?.value;
    const context = { ip: clientIp(req), ua: req.headers.get("user-agent") ?? "" };
    const customer = await getCustomerSession(token, context);
    if (!customer) return NextResponse.json({ ok: false }, { status: 401 });

    const body = await req.json();
    const { line1, city, state, zip, isDefault } = body;
    if (!line1 || !city || !state || !zip) {
      return NextResponse.json({ ok: false, error: "All address fields are required." }, { status: 400 });
    }
    if (
      typeof line1 !== "string" || line1.length > 200 ||
      typeof city  !== "string" || city.length  > 100 ||
      typeof state !== "string" || state.length  > 50  ||
      typeof zip   !== "string" || zip.length    > 20
    ) {
      return NextResponse.json({ ok: false, error: "One or more address fields are too long." }, { status: 400 });
    }

    const address = await saveAddress(customer.id, { line1: line1.trim(), city: city.trim(), state: state.trim(), zip: zip.trim(), isDefault: !!isDefault });
    return NextResponse.json({ ok: true, address });
  } catch (err) {
    return apiError("customer:addresses", err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get("awaken_customer")?.value;
    const context = { ip: clientIp(req), ua: req.headers.get("user-agent") ?? "" };
    const customer = await getCustomerSession(token, context);
    if (!customer) return NextResponse.json({ ok: false }, { status: 401 });

    const { addressId } = await req.json();
    if (!addressId || typeof addressId !== "string" || addressId.length > 100) {
      return NextResponse.json({ ok: false, error: "addressId required." }, { status: 400 });
    }

    await deleteAddress(customer.id, addressId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError("customer:addresses", err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = req.cookies.get("awaken_customer")?.value;
    const context = { ip: clientIp(req), ua: req.headers.get("user-agent") ?? "" };
    const customer = await getCustomerSession(token, context);
    if (!customer) return NextResponse.json({ ok: false }, { status: 401 });

    const { addressId } = await req.json();
    if (!addressId || typeof addressId !== "string" || addressId.length > 100) {
      return NextResponse.json({ ok: false, error: "addressId required." }, { status: 400 });
    }

    await setDefaultAddress(customer.id, addressId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError("customer:addresses", err);
  }
}
