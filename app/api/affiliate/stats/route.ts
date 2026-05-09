import { NextRequest, NextResponse } from "next/server";
import { getAffiliateSession, getAffiliateReferrals } from "@/lib/affiliate-db";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("awaken_affiliate")?.value;
  if (!token) return NextResponse.json({ ok: false }, { status: 401 });

  const account = await getAffiliateSession(token);
  if (!account) return NextResponse.json({ ok: false }, { status: 401 });

  const referrals = await getAffiliateReferrals(account.affiliateCode);

  const totalEarnings = referrals
    .reduce((s, r) => s + parseFloat(r.commission.replace(/[^0-9.]/g, "") || "0"), 0)
    .toFixed(2);

  const pending = referrals
    .filter((r) => r.status === "pending_payment" || r.status === "paid")
    .reduce((s, r) => s + parseFloat(r.commission.replace(/[^0-9.]/g, "") || "0"), 0)
    .toFixed(2);

  return NextResponse.json({
    ok: true,
    affiliateCode: account.affiliateCode,
    commissionRate: account.commissionRate,
    referrals,
    totalEarnings: `$${totalEarnings}`,
    pendingEarnings: `$${pending}`,
    totalConversions: referrals.length,
  });
}
