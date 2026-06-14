import { NextRequest, NextResponse } from "next/server";
import {
  getAffiliateSession,
  revokeAllAffiliateSessions,
  createAffiliateSession,
} from "@/lib/affiliate-db";
import { clientIp } from "@/lib/rate-limit";

// POST /api/affiliate/logout-everywhere
// Invalidates every active session for this affiliate, then issues a fresh
// session for the current device so the user stays logged in here.
export async function POST(req: NextRequest) {
  const token = req.cookies.get("awaken_affiliate")?.value;
  if (!token) {
    return NextResponse.json({ ok: false, error: "Not authenticated." }, { status: 401 });
  }

  const context = { ip: clientIp(req), ua: req.headers.get("user-agent") ?? "" };
  const account = await getAffiliateSession(token, context);
  if (!account) {
    return NextResponse.json({ ok: false, error: "Session expired. Please log in again." }, { status: 401 });
  }

  // Bump passwordVersion — invalidates every existing session token for this affiliate
  await revokeAllAffiliateSessions(account.id);

  // Re-issue a fresh session for the current device so they stay logged in
  const newToken = await createAffiliateSession(account.id, context);

  const res = NextResponse.json({ ok: true });
  res.cookies.set("awaken_affiliate", newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
