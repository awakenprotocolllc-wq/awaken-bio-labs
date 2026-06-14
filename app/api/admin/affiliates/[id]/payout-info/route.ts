import { NextRequest, NextResponse } from "next/server";
import { getAffiliatePayoutInfo } from "@/lib/affiliate-db";
import { validateAdminSession, isAdminPasswordStale } from "@/lib/admin-auth";
import { apiError } from "@/lib/api-error";

// GET — returns full (unmasked) payout info for admin
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!(await validateAdminSession(req.cookies.get("awaken_admin")?.value)))
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    if (await isAdminPasswordStale()) {
      return NextResponse.json(
        { ok: false, error: "Password rotation required. Go to System → Password Rotation to update your password before accessing banking data.", rotationRequired: true },
        { status: 403 }
      );
    }

    const info = await getAffiliatePayoutInfo(params.id);
    return NextResponse.json({ ok: true, info: info ?? null });
  } catch (err) {
    return apiError("GET /api/admin/affiliates/[id]/payout-info", err);
  }
}
