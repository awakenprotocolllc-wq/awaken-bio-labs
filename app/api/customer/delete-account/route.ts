import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession, deleteCustomerAccount } from "@/lib/customer-db";
import { sendAccountDeletionEmail } from "@/lib/customer-emails";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { apiError } from "@/lib/api-error";
import bcrypt from "bcryptjs";
import { kv } from "@vercel/kv";

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const { allowed } = await rateLimit(`customer:delete:${ip}`, 5, 60 * 60);
    if (!allowed) return NextResponse.json({ ok: false, error: "Too many attempts. Try again later." }, { status: 429 });

    const token = req.cookies.get("awaken_customer")?.value;
    const context = { ip, ua: req.headers.get("user-agent") ?? "" };
    const customer = await getCustomerSession(token, context);
    if (!customer) return NextResponse.json({ ok: false }, { status: 401 });

    // Require password confirmation before deletion
    const body = await req.json();
    const { password } = body;
    if (!password) return NextResponse.json({ ok: false, error: "Password required to delete account." }, { status: 400 });

    const raw = await kv.get<{ passwordHash: string }>(  `cust:${customer.id}`);
    if (!raw?.passwordHash) return NextResponse.json({ ok: false, error: "Account not found." }, { status: 404 });

    const valid = await bcrypt.compare(password, raw.passwordHash);
    if (!valid) return NextResponse.json({ ok: false, error: "Incorrect password." }, { status: 401 });

    // Capture info before deletion
    const { email, name } = customer;

    await deleteCustomerAccount(customer.id);

    // Send confirmation email (best-effort)
    await sendAccountDeletionEmail(email, name).catch((err) => {
      console.error("[customer:delete-account] Email failed:", err);
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set("awaken_customer", "", { maxAge: 0, path: "/" });
    return res;
  } catch (err) {
    return apiError("customer:delete-account", err);
  }
}
