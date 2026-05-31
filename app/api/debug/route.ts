import { NextResponse } from "next/server";

// Temporary debug endpoint — DELETE after diagnosing env var issue
export async function GET() {
  // Show all env var KEY names (not values) so we can spot typos
  const allKeys = Object.keys(process.env).sort();

  return NextResponse.json({
    QUIKLIE_API_KEY: process.env.QUIKLIE_API_KEY ? `set (${process.env.QUIKLIE_API_KEY.length} chars)` : "MISSING",
    QUIKLIE_MERCHANT_ID: process.env.QUIKLIE_MERCHANT_ID ?? "MISSING",
    // Show any key containing "QUIK" to catch typos
    quiklie_related_keys: allKeys.filter(k => k.includes("QUIK") || k.includes("quik")),
    // Show all custom keys (non-system) for full picture
    all_custom_keys: allKeys.filter(k => !k.startsWith("npm_") && !k.startsWith("NEXT_RUNTIME") && !k.startsWith("__")),
  });
}
