import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { validateAdminSession, getAdminPasswordHash, rotateAdminPassword } from "@/lib/admin-auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { apiError } from "@/lib/api-error";

export async function POST(req: NextRequest) {
  try {
    // 5 attempts per 15 minutes per IP — mirrors the login rate limit
    const { allowed } = await rateLimit(`admin-change-pw:${clientIp(req)}`, 5, 60 * 15);
    if (!allowed) {
      return NextResponse.json({ ok: false, error: "Too many attempts. Try again later." }, { status: 429 });
    }

    if (!(await validateAdminSession(req.cookies.get("awaken_admin")?.value))) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) ?? {};
    const { currentPassword, newPassword } = body;

    if (typeof currentPassword !== "string" || currentPassword.length === 0) {
      return NextResponse.json({ ok: false, error: "Current password is required." }, { status: 400 });
    }
    if (typeof newPassword !== "string" || newPassword.length < 16 || newPassword.length > 128) {
      return NextResponse.json({ ok: false, error: "New password must be 16–128 characters." }, { status: 400 });
    }
    if (currentPassword === newPassword) {
      return NextResponse.json({ ok: false, error: "New password must differ from the current password." }, { status: 400 });
    }

    const currentHash = await getAdminPasswordHash();
    if (!currentHash) {
      return NextResponse.json({ ok: false, error: "Admin auth not configured." }, { status: 500 });
    }

    const valid = await bcrypt.compare(currentPassword, currentHash);
    if (!valid) {
      return NextResponse.json({ ok: false, error: "Current password is incorrect." }, { status: 403 });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await rotateAdminPassword(newHash);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError("POST /api/admin/change-password", err);
  }
}
