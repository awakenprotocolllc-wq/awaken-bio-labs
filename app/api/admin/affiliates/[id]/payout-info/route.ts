import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAffiliatePayoutInfo } from "@/lib/affiliate-db";

function isAdmin(): boolean {
  const token = cookies().get("awaken_admin")?.value;
  const expected = process.env.ADMIN_SESSION_TOKEN;
  return !!(expected && token === expected);
}

// GET — returns full (unmasked) payout info for admin
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdmin()) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const info = await getAffiliatePayoutInfo(params.id);
  return NextResponse.json({ ok: true, info: info ?? null });
}
