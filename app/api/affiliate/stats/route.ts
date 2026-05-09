import { NextRequest, NextResponse } from "next/server";
import { getAffiliateSession, getAffiliateReferrals } from "@/lib/affiliate-db";

function commissionValue(commission: string): number {
  return parseFloat(commission.replace(/[^0-9.]/g, "") || "0");
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("awaken_affiliate")?.value;
  if (!token) return NextResponse.json({ ok: false }, { status: 401 });

  const account = await getAffiliateSession(token);
  if (!account) return NextResponse.json({ ok: false }, { status: 401 });

  const referrals = await getAffiliateReferrals(account.affiliateCode);

  // Confirmed = order has been fulfilled (shipped/delivered)
  const confirmedEarnings = referrals
    .filter((r) => r.status === "fulfilled")
    .reduce((s, r) => s + commissionValue(r.commission), 0)
    .toFixed(2);

  // Pending = order placed but not yet fulfilled (awaiting payment or paid but not shipped)
  const pendingEarnings = referrals
    .filter((r) => r.status === "pending_payment" || r.status === "paid")
    .reduce((s, r) => s + commissionValue(r.commission), 0)
    .toFixed(2);

  // Exclude cancelled orders from conversion count
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
}
