import { NextResponse } from "next/server";

// Temporary public debug endpoint — DELETE after diagnosing env var issue
export async function GET() {
  return NextResponse.json({
    QUIKLIE_API_KEY: process.env.QUIKLIE_API_KEY ? `set (${process.env.QUIKLIE_API_KEY.length} chars)` : "MISSING",
    QUIKLIE_MERCHANT_ID: process.env.QUIKLIE_MERCHANT_ID ? `set — value: ${process.env.QUIKLIE_MERCHANT_ID}` : "MISSING",
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "MISSING",
    NODE_ENV: process.env.NODE_ENV,
  });
}
