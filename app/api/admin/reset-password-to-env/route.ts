/**
 * Emergency password reset — clears the KV-stored admin password hash so the
 * system falls back to the ADMIN_PASSWORD env var.
 *
 * USAGE:
 *   1. Set ADMIN_RESET_TOKEN=<any long random string> in Vercel env vars
 *   2. POST /api/admin/reset-password-to-env  { "token": "<same value>" }
 *   3. On success, remove ADMIN_RESET_TOKEN from Vercel env vars
 *
 * This endpoint does nothing unless ADMIN_RESET_TOKEN is set.
 */
import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { apiError } from "@/lib/api-error";

export async function POST(req: NextRequest) {
  try {
    const { allowed } = await rateLimit(`admin:reset-pw-env:${clientIp(req)}`, 5, 60 * 60);
    if (!allowed) return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 });

    const resetToken = process.env.ADMIN_RESET_TOKEN;
    if (!resetToken) {
      return NextResponse.json({ ok: false, error: "Not enabled." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    if (body?.confirm !== "yes") {
      return NextResponse.json({ ok: false, error: 'Send {"confirm":"yes"} to proceed.' }, { status: 400 });
    }

    // Clear the KV hash — login will now use ADMIN_PASSWORD env var
    await kv.set("admin:password:meta", { hash: null, changedAt: new Date().toISOString() });

    return NextResponse.json({
      ok: true,
      message: "KV password hash cleared. Admin login now uses ADMIN_PASSWORD env var. Remove ADMIN_RESET_TOKEN from Vercel env vars now.",
    });
  } catch (err) {
    return apiError("admin:reset-password-to-env", err);
  }
}
