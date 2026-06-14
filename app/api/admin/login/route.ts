import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { createAdminSession } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  // 10 attempts per 15 minutes per IP
  const { allowed } = await rateLimit(`admin-login:${clientIp(req)}`, 10, 60 * 15);
  if (!allowed) {
    return NextResponse.json({ ok: false, error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = (await req.json()) ?? {};
  const { password } = body;

  if (typeof password !== "string" || password.length === 0 || password.length > 128) {
    return NextResponse.json({ ok: false, error: "Invalid password" }, { status: 401 });
  }

  const adminPasswordHash = process.env.ADMIN_PASSWORD;
  if (!adminPasswordHash) {
    return NextResponse.json({ ok: false, error: "Auth not configured" }, { status: 500 });
  }

  // ADMIN_PASSWORD must be a bcrypt hash — compare with bcrypt.compare, never plain ===
  const valid = await bcrypt.compare(password, adminPasswordHash);
  if (!valid) {
    return NextResponse.json({ ok: false, error: "Invalid password" }, { status: 401 });
  }

  // Per-login session token stored in KV — invalidated on logout
  const sessionToken = await createAdminSession();

  const res = NextResponse.json({ ok: true });
  res.cookies.set("awaken_admin", sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
