import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession, createVerificationToken } from "@/lib/customer-db";
import { sendVerificationEmail } from "@/lib/customer-emails";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { apiError } from "@/lib/api-error";

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const { allowed } = await rateLimit(`customer:resend-verify:${ip}`, 3, 60 * 10);
    if (!allowed) return NextResponse.json({ ok: false, error: "Too many requests. Try again later." }, { status: 429 });

    const token = req.cookies.get("awaken_customer")?.value;
    const context = { ip, ua: req.headers.get("user-agent") ?? "" };
    const customer = await getCustomerSession(token, context);
    if (!customer) return NextResponse.json({ ok: false, error: "Not logged in." }, { status: 401 });

    if (customer.emailVerified) {
      return NextResponse.json({ ok: true, alreadyVerified: true });
    }

    const verifyToken = await createVerificationToken(customer.id, customer.email);
    await sendVerificationEmail(customer.email, customer.name, verifyToken);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError("customer:resend-verify", err);
  }
}
