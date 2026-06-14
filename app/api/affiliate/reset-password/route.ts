import { NextRequest, NextResponse } from "next/server";
import {
  consumePasswordResetToken,
  getAffiliateSession,
  validateAffiliateLogin,
  setAffiliatePassword,
} from "@/lib/affiliate-db";

// POST /api/affiliate/reset-password
//
// Two modes:
//   1. Forgot-password flow  — body: { token, password }
//   2. In-dashboard change   — body: { currentPassword, newPassword }  (requires session cookie)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ── Mode 2: authenticated password change from dashboard ──
    if ("currentPassword" in body || "newPassword" in body) {
      const { currentPassword, newPassword } = body;

      if (!currentPassword || typeof currentPassword !== "string" || currentPassword.length > 128) {
        return NextResponse.json({ ok: false, error: "Current password is required." }, { status: 400 });
      }
      if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6 || newPassword.length > 128) {
        return NextResponse.json({ ok: false, error: "New password must be 6–128 characters." }, { status: 400 });
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
    if (!password || typeof password !== "string" || password.length < 8 || password.length > 128) {
      return NextResponse.json(
        { ok: false, error: "Password must be 8–128 characters." },
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
