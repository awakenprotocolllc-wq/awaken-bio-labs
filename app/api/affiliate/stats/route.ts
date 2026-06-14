import { NextRequest, NextResponse } from "next/server";
import { getAffiliateSession, getAffiliateReferrals } from "@/lib/affiliate-db";
import { clientIp } from "@/lib/rate-limit";
import { apiError } from "@/lib/api-error";

function commissionValue(commission: string): number {
  return parseFloat(commission.replace(/[^0-9.]/g, "") || "0");
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("awaken_affiliate")?.value;
    if (!token) return NextResponse.json({ ok: false }, { status: 401 });

    const account = await getAffiliateSession(token, { ip: clientIp(req), ua: req.headers.get("user-agent") ?? "" });
    if (!account) return NextResponse.json({ ok: false }, { status: 401 });

    const referrals = await getAffiliateReferrals(account.affiliateCode);

    const confirmedEarnings = referrals
      .filter((r) => r.status === "fulfilled")
      .reduce((s, r) => s + commissionValue(r.commission), 0)
      .toFixed(2);

    const pendingEarnings = referrals
      .filter((r) => r.status === "pending_payment" || r.status === "paid")
      .reduce((s, r) => s + commissionValue(r.commission), 0)
      .toFixed(2);

    const activeReferrals = referrals.filter((r) => r.status !== "cancelled");

    return NextResponse.json({
      ok: true,
      affiliateCode: account.affiliateCode,
      commissionRate: account.commissionRate,
      referrals,
      confirmedEarnings: `$${confirmedEarnings}`,
      pendingEarnings: `$${pendingEarnings}`,
      totalConversions: activeReferrals.length,
    });
  } catch (err) {
    return apiError("GET /api/affiliate/stats", err);
  }
}
