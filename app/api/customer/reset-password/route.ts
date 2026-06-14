import { NextRequest, NextResponse } from "next/server";
import { peekPasswordResetToken, consumePasswordResetToken } from "@/lib/customer-db";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { apiError } from "@/lib/api-error";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token") ?? "";
    const status = await peekPasswordResetToken(token);
    return NextResponse.json({ ok: status === "valid", status });
  } catch (err) {
    return apiError("customer:reset-password", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const { allowed } = await rateLimit(`customer:reset:${ip}`, 5, 60 * 15);
    if (!allowed) return NextResponse.json({ ok: false, error: "Too many attempts." }, { status: 429 });

    const body = await req.json();
    const token: string   = body.token ?? "";
    const password: string = body.password ?? "";

    if (!token || !password) {
      return NextResponse.json({ ok: false, error: "Token and new password are required." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ ok: false, error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const ok = await consumePasswordResetToken(token, password);
    if (!ok) {
      return NextResponse.json({ ok: false, error: "Reset link is invalid or has expired." }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError("customer:reset-password", err);
  }
}
