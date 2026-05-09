import { NextRequest, NextResponse } from "next/server";
import {
  listApplications,
  updateApplicationStatus,
  createAffiliateAccount,
  generateAffiliateCode,
} from "@/lib/affiliate-db";

function isAdmin(req: NextRequest): boolean {
  const token = req.cookies.get("awaken_admin")?.value;
  const expected = process.env.ADMIN_SESSION_TOKEN;
  return !!expected && token === expected;
}

// PATCH /api/admin/affiliates/[id]
// body: { action: "approve", password: string, affiliateCode?: string, commissionRate?: number }
//     | { action: "deny" }
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdmin(req)) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json();
  const { action, password, affiliateCode, commissionRate } = body ?? {};

  const apps = await listApplications();
  const app = apps.find((a) => a.id === params.id);
  if (!app) return NextResponse.json({ ok: false, error: "Application not found" }, { status: 404 });

  if (action === "deny") {
    await updateApplicationStatus(params.id, "denied");
    return NextResponse.json({ ok: true });
  }

  if (action === "approve") {
    if (!password || password.length < 6) {
      return NextResponse.json(
        { ok: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const code = (affiliateCode || generateAffiliateCode(app.name)).toUpperCase();
    const rate = typeof commissionRate === "number" ? commissionRate : 0.25;

    const account = await createAffiliateAccount(
      params.id,
      app.name,
      app.email,
      password,
      code,
      rate
    );
    await updateApplicationStatus(params.id, "approved");

    return NextResponse.json({ ok: true, account });
  }

  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}
