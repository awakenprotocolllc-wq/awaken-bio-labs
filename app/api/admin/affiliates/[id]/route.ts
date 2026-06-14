import { NextRequest, NextResponse } from "next/server";
import {
  listApplications,
  updateApplicationStatus,
  createAffiliateAccount,
  generateAffiliateCode,
  createContractToken,
  updateAffiliateStatus,
  updateAffiliateProgram,
  updateAffiliateDetails,
  archiveAffiliate,
  getAffiliateById,
  listAffiliates,
  setAffiliatePassword,
  type ProgramType,
} from "@/lib/affiliate-db";
import { sendContractSigningEmail, sendCredentialsEmail, sendProgramSwitchEmail } from "@/lib/affiliate-emails";
import { isStr, isNum, isEnum } from "@/lib/validate";
import { validateAdminSession } from "@/lib/admin-auth";

const VALID_ACTIONS = [
  "approve", "deny", "suspend", "reactivate", "archive",
  "switch-program", "update-details", "set-password",
  "force-activate", "resend-contract", "reonboard",
] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_RE  = /^[A-Z0-9]{2,20}$/;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://awakenbiolabs.com";



// PATCH /api/admin/affiliates/[id]
// body: { action: "approve", password: string, affiliateCode?: string, commissionRate?: number }
//     | { action: "deny" }
//     | { action: "suspend" }
//     | { action: "reactivate" }
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await validateAdminSession(req.cookies.get("awaken_admin")?.value))) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json();
  const { action, password, affiliateCode, commissionRate } = body ?? {};

  if (!isEnum(action, VALID_ACTIONS)) {
    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  }

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

  // --- Update details (name, email, code, commission) ---
  if (action === "update-details") {
    const { name, email, affiliateCode, commissionRate } = body;
    if (!isStr(name, 200) || !isStr(email, 254) || !isStr(affiliateCode, 20)) {
      return NextResponse.json({ ok: false, error: "Name, email, and code are required" }, { status: 400 });
    }
    if (!EMAIL_RE.test(email.trim())) {
      return NextResponse.json({ ok: false, error: "Invalid email address" }, { status: 400 });
    }
    if (!CODE_RE.test(affiliateCode.trim().toUpperCase())) {
      return NextResponse.json({ ok: false, error: "Affiliate code must be 2–20 uppercase letters and numbers" }, { status: 400 });
    }
    if (!isNum(commissionRate, 0, 1)) {
      return NextResponse.json({ ok: false, error: "Commission rate must be between 0% and 100%" }, { status: 400 });
    }
    const updated = await updateAffiliateDetails(params.id, {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      affiliateCode: affiliateCode.trim().toUpperCase(),
      commissionRate,
    });
    if (!updated) return NextResponse.json({ ok: false, error: "Affiliate not found" }, { status: 404 });
    return NextResponse.json({ ok: true, account: updated });
  }

  // --- Set password (admin only) ---
  if (action === "set-password") {
    const { newPassword } = body;
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8 || newPassword.length > 128) {
      return NextResponse.json({ ok: false, error: "Password must be 8–128 characters" }, { status: 400 });
    }
    const ok = await setAffiliatePassword(params.id, newPassword);
    if (!ok) return NextResponse.json({ ok: false, error: "Affiliate not found or write failed" }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  // --- Force activate (pending_contract → active, bypasses contract signing) ---
  if (action === "force-activate") {
    const aff = await getAffiliateById(params.id);
    if (!aff) return NextResponse.json({ ok: false, error: "Affiliate not found" }, { status: 404 });
    if (aff.status !== "pending_contract") {
      return NextResponse.json({ ok: false, error: "Only pending_contract accounts can be force-activated" }, { status: 400 });
    }
    await updateAffiliateStatus(params.id, "active", {
      contractSignedAt: new Date().toISOString(),
    });
    const updated = await getAffiliateById(params.id);
    return NextResponse.json({ ok: true, account: updated });
  }

  // --- Resend contract (pending_contract → fresh signing link, no status change) ---
  if (action === "resend-contract") {
    const aff = await getAffiliateById(params.id);
    if (!aff) return NextResponse.json({ ok: false, error: "Affiliate not found" }, { status: 404 });
    if (aff.status !== "pending_contract") {
      return NextResponse.json({ ok: false, error: "Only pending_contract accounts can have contracts resent" }, { status: 400 });
    }

    // Generate a fresh 7-day contract token
    const token = await createContractToken(aff.id, aff.name, aff.email);
    const contractUrl = `${SITE}/affiliates/contract?token=${token}`;

    try {
      await sendContractSigningEmail({
        name: aff.name,
        email: aff.email,
        contractUrl,
        commissionRate: aff.commissionRate,
      });
      console.log("[resend-contract] sent to:", aff.email);
    } catch (err) {
      console.error("[resend-contract] email failed:", err);
      return NextResponse.json({ ok: false, error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
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
    const token = await createContractToken(aff.id, aff.name, aff.email, true);
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
    if (!password || typeof password !== "string" || password.length < 8 || password.length > 128) {
      return NextResponse.json(
        { ok: false, error: "Password must be 8–128 characters" },
        { status: 400 }
      );
    }
    if (affiliateCode !== undefined && (!isStr(affiliateCode, 20) || !CODE_RE.test(affiliateCode.trim().toUpperCase()))) {
      return NextResponse.json({ ok: false, error: "Affiliate code must be 2–20 uppercase letters and numbers" }, { status: 400 });
    }
    if (commissionRate !== undefined && !isNum(commissionRate, 0, 1)) {
      return NextResponse.json({ ok: false, error: "Commission rate must be between 0% and 100%" }, { status: 400 });
    }

    const code = (affiliateCode || generateAffiliateCode(app.name)).toUpperCase();
    const programType = app.programType ?? "ambassador";
    // Licensees are always 50% — not overridable
    const rate = programType === "licensee" ? 0.50 : (isNum(commissionRate, 0, 1) ? commissionRate : 0.20);

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

    // Send credentials email BEFORE the contract token — password never stored in KV
    try {
      await sendCredentialsEmail({
        name: app.name,
        email: app.email,
        affiliateCode: account.affiliateCode,
        password,
        commissionRate: account.commissionRate,
      });
    } catch (err) {
      console.error("[affiliates/approve] credentials email failed:", err);
    }

    // Generate contract token (no password stored)
    const token = await createContractToken(account.id, app.name, app.email);
    const contractUrl = `${SITE}/affiliates/contract?token=${token}`;

    try {
      await sendContractSigningEmail({
        name: app.name,
        email: app.email,
        contractUrl,
        commissionRate: account.commissionRate,
      });
    } catch (err) {
      console.error("[affiliates/approve] contract email failed:", err);
    }

    return NextResponse.json({ ok: true, account });
  }

  // Exhausted all VALID_ACTIONS branches — should not be reachable
  return NextResponse.json({ ok: false, error: "Unhandled action" }, { status: 500 });
}
