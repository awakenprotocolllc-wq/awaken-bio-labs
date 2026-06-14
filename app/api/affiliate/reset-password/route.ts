import { NextRequest, NextResponse } from "next/server";
import {
  consumePasswordResetToken,
  getAffiliateSession,
  validateAffiliateLogin,
  setAffiliatePassword,
  peekPasswordResetToken,
} from "@/lib/affiliate-db";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { validatePassword, checkBreachedPassword } from "@/lib/password";

// GET /api/affiliate/reset-password?token=xxx
// Check a token's status without consuming it. Used by the reset page to validate before rendering the form.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const status = await peekPasswordResetToken(token);
  return NextResponse.json({ status });
}

// POST /api/affiliate/reset-password
//
// Two modes:
//   1. Forgot-password flow  — body: { token, password }
//   2. In-dashboard change   — body: { currentPassword, newPassword }  (requires session cookie)
export async function POST(req: NextRequest) {
  try {
    // 5 attempts per minute per IP — applies to both modes
    const { allowed } = await rateLimit(`password-change:${clientIp(req)}`, 5, 60);
    if (!allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many attempts. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    const body = await req.json();

    // ── Mode 2: authenticated password change from dashboard ──
    if ("currentPassword" in body || "newPassword" in body) {
      const { currentPassword, newPassword } = body;

      if (!currentPassword || typeof currentPassword !== "string" || currentPassword.length > 128) {
        return NextResponse.json({ ok: false, error: "Current password is required." }, { status: 400 });
      }

      const pwError = validatePassword(newPassword ?? "");
      if (pwError) {
        return NextResponse.json({ ok: false, error: pwError }, { status: 400 });
      }

      const sessionToken = req.cookies.get("awaken_affiliate")?.value;
      if (!sessionToken) {
        return NextResponse.json({ ok: false, error: "Not authenticated." }, { status: 401 });
      }

      const account = await getAffiliateSession(sessionToken);
      if (!account) {
        return NextResponse.json({ ok: false, error: "Session expired. Please log in again." }, { status: 401 });
      }

      // Verify current password
      const valid = await validateAffiliateLogin(account.email, currentPassword);
      if (!valid) {
        return NextResponse.json({ ok: false, error: "Current password is incorrect." }, { status: 403 });
      }

      if (await checkBreachedPassword(newPassword)) {
        return NextResponse.json(
          { ok: false, error: "This password has appeared in a data breach. Please choose a different one." },
          { status: 400 }
        );
      }

      const ok = await setAffiliatePassword(account.id, newPassword);
      if (!ok) {
        return NextResponse.json({ ok: false, error: "Failed to update password. Please try again." }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }

    // ── Mode 1: forgot-password token flow ──
    const { token, password } = body;

    if (!token || typeof token !== "string" || token.length > 256) {
      return NextResponse.json({ ok: false, error: "Missing reset token." }, { status: 400 });
    }

    const pwError = validatePassword(password ?? "");
    if (pwError) {
      return NextResponse.json({ ok: false, error: pwError }, { status: 400 });
    }

    if (await checkBreachedPassword(password)) {
      return NextResponse.json(
        { ok: false, error: "This password has appeared in a data breach. Please choose a different one." },
        { status: 400 }
      );
    }

    const success = await consumePasswordResetToken(token, password);
    if (!success) {
      return NextResponse.json(
        { ok: false, error: "This reset link is invalid or has expired. Please request a new one." },
        { status: 410 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/affiliate/reset-password]", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
