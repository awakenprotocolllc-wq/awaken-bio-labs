import { NextRequest, NextResponse } from "next/server";
import { getAffiliateById, getAffiliateReferrals } from "@/lib/affiliate-db";

function isAdmin(req: NextRequest): boolean {
  const token = req.cookies.get("awaken_admin")?.value;
  const expected = process.env.ADMIN_SESSION_TOKEN;
  return !!expected && token === expected;
}

function commissionValue(commission: string): number {
  return parseFloat(commission.replace(/[^0-9.]/g, "") || "0");
}

// GET /api/admin/affiliates/[id]/stats
// Returns the same shape as /api/affiliate/stats but for any affiliate, admin-only
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdmin(req)) return NextResponse.json({ ok: false }, { status: 401 });

  const account = await getAffiliateById(params.id);
  if (!account) return NextResponse.json({ ok: false, error: "Affiliate not found" }, { status: 404 });

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
    name: account.name,
    email: account.email,
    affiliateCode: account.affiliateCode,
    commissionRate: account.commissionRate,
    programType: account.programType,
    status: account.status,
    joinedAt: account.joinedAt,
    referrals,
    confirmedEarnings: `$${confirmedEarnings}`,
    pendingEarnings: `$${pendingEarnings}`,
    totalConversions: activeReferrals.length,
  });
}
