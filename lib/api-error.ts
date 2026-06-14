import { NextResponse } from "next/server";

/**
 * Call from every API route catch block.
 * Logs the full error server-side (visible in Vercel logs) and returns a
 * generic 500 response so no internal detail ever reaches the client.
 */
export function apiError(label: string, err: unknown): NextResponse {
  console.error(`[${label}]`, err);
  return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
}
