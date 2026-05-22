import { NextRequest, NextResponse } from "next/server";
import {
  listApplications,
  updateApplicationStatus,
  createAffiliateAccount,
  generateAffiliateCode,
  createContractToken,
  updateAffiliateStatus,
  updateAffiliateProgram,
  archiveAffiliate,
  getAffiliateById,
  listAffiliates,
  type ProgramType,
} from "@/lib/affiliate-db";
import { sendContractSigningEmail, sendProgramSwitchEmail } from "@/lib/affiliate-emails";

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

  // --- Suspend / Reactivate ---
  if (action === "suspend" || action === "reactivate") {
    const affiliates = await listAffiliates();
    const aff = affiliates.find((a) => a.id === params.id);
    if (!aff) return NextResponse.json({ ok: false, error: "Affiliate not found" }, { status: 404 });
    await updateAffiliateStatus(params.id, action === "suspend" ? "suspended" : "active");
    return NextResponse.json({ ok: true });
  }

  // --- Archive ---
  if (action === "archive") {
    const aff = await getAffiliateById(params.id);
    if (!aff) return NextResponse.json({ ok: false, error: "Affiliate not found" }, { status: 404 });
    await archiveAffiliate(params.id);
    return NextResponse.json({ ok: true });
  }

  // --- Switch program type ---
  if (action === "switch-program") {
    const newProgram = body.programType as ProgramType;
    if (newProgram !== "ambassador" && newProgram !== "licensee") {
      return NextResponse.json({ ok: false, error: "Invalid program type" }, { status: 400 });
    }
    const aff = await getAffiliateById(params.id);
    if (!aff) return NextResponse.json({ ok: false, error: "Affiliate not found" }, { status: 404 });

    const updated = await updateAffiliateProgram(params.id, newProgram);
    if (!updated) return NextResponse.json({ ok: false, error: "Update failed" }, { status: 500 });

    // Notify the partner
    try {
      await sendProgramSwitchEmail({
        name: aff.name,
        email: aff.email,
        oldProgram: aff.programType ?? "ambassador",
        newProgram,
        commissionRate: updated.commissionRate,
        affiliateCode: aff.affiliateCode,
      });
    } catch (err) {
      console.error("[switch-program] email failed:", err);
    }

    return NextResponse.json({ ok: true, account: updated });
  }

  // --- Re-onboard (archived → pending_contract, new contract link) ---
  if (action === "reonboard") {
    const aff = await getAffiliateById(params.id);
    if (!aff) return NextResponse.json({ ok: false, error: "Affiliate not found" }, { status: 404 });
    if (aff.status !== "archived") {
      return NextResponse.json({ ok: false, error: "Only archived accounts can be re-onboarded" }, { status: 400 });
    }

    // Reset to pending_contract so they must sign before accessing dashboard
    await updateAffiliateStatus(params.id, "pending_contract");

    // Generate a new 7-day contract token (isReOnboard=true → welcome-back email after signing)
    const token = await createContractToken(aff.id, aff.name, aff.email, "", true);
    const contractUrl = `${SITE}/affiliates/contract?token=${token}`;

    try {
      await sendContractSigningEmail({
        name: aff.name,
        email: aff.email,
        contractUrl,
        commissionRate: aff.commissionRate,
      });
    } catch (err) {
      console.error("[reonboard] contract email failed:", err);
    }

    return NextResponse.json({ ok: true });
  }

  // --- Approve / Deny ---
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
    const programType = app.programType ?? "ambassador";
    // Licensees are always 50% — not overridable
    const rate = programType === "licensee" ? 0.50 : (typeof commissionRate === "number" ? commissionRate : 0.20);

    // Create account in pending_contract state
    const account = await createAffiliateAccount(
      params.id,
      app.name,
      app.email,
      password,
      code,
      rate,
      0.10,
      programType
    );
    await updateApplicationStatus(params.id, "approved");

    // Generate contract token (stores password temporarily so it can be emailed after signing)
    const token = await createContractToken(account.id, app.name, app.email, password);
    const contractUrl = `${SITE}/affiliates/contract?token=${token}`;

    // Await the email — do NOT fire-and-forget on Vercel (function exits before fetch completes)
    try {
      await sendContractSigningEmail({
        name: app.name,
        email: app.email,
        contractUrl,
        commissionRate: account.commissionRate,
      });
    } catch (err) {
      console.error("[affiliates/approve] contract email failed:", err);
      // Don't fail the whole response — account is created, admin can resend manually
    }

    return NextResponse.json({ ok: true, account });
  }

  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}
