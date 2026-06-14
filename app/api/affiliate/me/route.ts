import { NextRequest, NextResponse } from "next/server";
import { getAffiliateSession, toAffiliateProfile } from "@/lib/affiliate-db";
import { clientIp } from "@/lib/rate-limit";
import { apiError } from "@/lib/api-error";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("awaken_affiliate")?.value;
    if (!token) return NextResponse.json({ ok: false }, { status: 401 });

    const account = await getAffiliateSession(token, { ip: clientIp(req), ua: req.headers.get("user-agent") ?? "" });
    if (!account) return NextResponse.json({ ok: false }, { status: 401 });

    return NextResponse.json({ ok: true, user: toAffiliateProfile(account) });
  } catch (err) {
    return apiError("GET /api/affiliate/me", err);
  }
}
