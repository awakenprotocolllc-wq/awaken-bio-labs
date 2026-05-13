import { NextRequest, NextResponse } from "next/server";
import {
  listApplications,
  updateApplicationStatus,
  createAffiliateAccount,
  generateAffiliateCode,
  createContractToken,
  updateAffiliateStatus,
  listAffiliates,
} from "@/lib/affiliate-db";
import { sendContractSigningEmail } from "@/lib/affiliate-emails";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://awakenbiolabs.com";

function isAdmin(req: NextRequest): boolean {
  const token = req.cookies.get("awaken_admin")?.value;
  const expected = process.env.ADMIN_SESSION_TOKEN;
  return !!expected && token === expected;
}

// PATCH /api/admin/affiliates/[id]
// body: { action: "approve", password: string, affiliateCode?: string, commissionRate?: number }
//     | { action: "deny" }
//     | { action: "suspend" }
//     | { action: "reactivate" }
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdmin(req)) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json();
  const { action, password, affiliateCode, commissionRate } = body ?? {};

  // --- Suspend / Reactivate (operates on affiliate account, not application) ---
  if (action === "suspend" || action === "reactivate") {
    const affiliates = await listAffiliates();
    const aff = affiliates.find((a) => a.id === params.id);
    if (!aff) return NextResponse.json({ ok: false, error: "Affiliate not found" }, { status: 404 });

    await updateAffiliateStatus(
      params.id,
      action === "suspend" ? "suspended" : "active"
    );
    return NextResponse.json({ ok: true });
  }

  // --- Approve / Deny (operates on application) ---
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

    // Create account in pending_contract state (not active yet)
    const account = await createAffiliateAccount(
      params.id,
      app.name,
      app.email,
      password,
      code,
      rate
    );
    await updateApplicationStatus(params.id, "approved");

    // Generate contract token (stores password temporarily for post-sign email)
    const token = await createContractToken(account.id, app.name, app.email, password);
    const contractUrl = `${SITE}/affiliates/contract?token=${token}`;

    // Send contract signing email (non-blocking)
    sendContractSigningEmail({
      name: app.name,
      email: app.email,
      contractUrl,
      commissionRate: account.commissionRate,
    }).catch((err) => console.error("[affiliates/approve] email error:", err));

    return NextResponse.json({ ok: true, account });
  }

  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}
