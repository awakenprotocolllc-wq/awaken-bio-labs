import { NextRequest, NextResponse } from "next/server";

// Temporary debug endpoint — DELETE after diagnosing env var issue
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  const expected = process.env.ADMIN_SESSION_TOKEN;
  if (!expected || secret !== expected) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    QUIKLIE_API_KEY: process.env.QUIKLIE_API_KEY ? `set (${process.env.QUIKLIE_API_KEY.length} chars)` : "MISSING",
    QUIKLIE_MERCHANT_ID: process.env.QUIKLIE_MERCHANT_ID ? `set — value: ${process.env.QUIKLIE_MERCHANT_ID}` : "MISSING",
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "MISSING",
    NODE_ENV: process.env.NODE_ENV,
  });
}
