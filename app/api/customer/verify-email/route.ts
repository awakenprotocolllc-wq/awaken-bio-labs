import { NextRequest, NextResponse } from "next/server";
import { consumeVerificationToken, getCustomerById } from "@/lib/customer-db";
import { sendWelcomeEmail } from "@/lib/customer-emails";
import { apiError } from "@/lib/api-error";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token") ?? "";
    if (!token) return NextResponse.json({ ok: false, error: "Missing token." }, { status: 400 });

    const result = await consumeVerificationToken(token);

    if (result === "invalid" || result === "expired") {
      return NextResponse.json({ ok: false, error: "Verification link is invalid or has expired." }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError("customer:verify-email", err);
  }
}
