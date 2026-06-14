import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAffiliatePayoutInfo } from "@/lib/affiliate-db";
import { validateAdminSession } from "@/lib/admin-auth";

// GET — returns full (unmasked) payout info for admin
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await validateAdminSession(cookies().get("awaken_admin")?.value))) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const info = await getAffiliatePayoutInfo(params.id);
  return NextResponse.json({ ok: true, info: info ?? null });
}
