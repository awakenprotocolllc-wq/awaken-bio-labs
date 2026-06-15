import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession, updateCustomer, changeCustomerPassword } from "@/lib/customer-db";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { apiError } from "@/lib/api-error";

export async function PATCH(req: NextRequest) {
  try {
    const token = req.cookies.get("awaken_customer")?.value;
    const context = { ip: clientIp(req), ua: req.headers.get("user-agent") ?? "" };
    const customer = await getCustomerSession(token, context);
    if (!customer) return NextResponse.json({ ok: false }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    if (action === "update_profile") {
      const { name, marketingOptIn } = body;
      const trimmedName = typeof name === "string" ? name.trim() : undefined;
      if (trimmedName !== undefined && (trimmedName.length === 0 || trimmedName.length > 120)) {
        return NextResponse.json({ ok: false, error: "Name must be between 1 and 120 characters." }, { status: 400 });
      }
      const updated = await updateCustomer(customer.id, {
        ...(trimmedName ? { name: trimmedName } : {}),
        ...(typeof marketingOptIn === "boolean" ? { marketingOptIn } : {}),
      });
      return NextResponse.json({ ok: true, customer: updated });
    }

    if (action === "change_password") {
      const { allowed } = await rateLimit(`customer:change-pw:${customer.id}`, 5, 60 * 15);
      if (!allowed) return NextResponse.json({ ok: false, error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });

      const { currentPassword, newPassword } = body;
      if (!currentPassword || !newPassword) {
        return NextResponse.json({ ok: false, error: "Both current and new password are required." }, { status: 400 });
      }
      if (newPassword.length < 8) {
        return NextResponse.json({ ok: false, error: "New password must be at least 8 characters." }, { status: 400 });
      }
      const ok = await changeCustomerPassword(customer.id, currentPassword, newPassword);
      if (!ok) {
        return NextResponse.json({ ok: false, error: "Current password is incorrect." }, { status: 400 });
      }
      // Session is still valid (the current session survives; other sessions are invalidated via passwordVersion bump)
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Unknown action." }, { status: 400 });
  } catch (err) {
    return apiError("customer:settings", err);
  }
}
