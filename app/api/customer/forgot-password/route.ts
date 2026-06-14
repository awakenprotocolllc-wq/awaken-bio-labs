import { NextRequest, NextResponse } from "next/server";
import { createPasswordResetToken, getCustomerByEmail } from "@/lib/customer-db";
import { sendPasswordResetEmail } from "@/lib/customer-emails";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { apiError } from "@/lib/api-error";

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const { allowed } = await rateLimit(`customer:forgot:${ip}`, 5, 60 * 60);
    if (!allowed) return NextResponse.json({ ok: false, error: "Too many requests. Try again later." }, { status: 429 });

    const body = await req.json();
    const email: string = (body.email ?? "").trim().toLowerCase();

    if (!email) return NextResponse.json({ ok: false, error: "Email is required." }, { status: 400 });

    // Always return success to prevent user enumeration
    const customer = await getCustomerByEmail(email);
    if (customer) {
      const token = await createPasswordResetToken(email);
      if (token) {
        await sendPasswordResetEmail(customer.email, customer.name, token).catch((err) => {
          console.error("[customer:forgot-password] Email failed:", err);
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError("customer:forgot-password", err);
  }
}
