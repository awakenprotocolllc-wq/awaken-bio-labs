import { NextRequest, NextResponse } from "next/server";
import { getContractToken, signContract } from "@/lib/affiliate-db";
import { sendWelcomeBackEmail } from "@/lib/affiliate-emails";
import { apiError } from "@/lib/api-error";

// POST /api/affiliate/sign-contract
// body: { token: string; signatureName: string }
export async function POST(req: NextRequest) {
  try {
    const { token, signatureName } = await req.json();

    if (!token || typeof token !== "string" || token.length > 256) {
      return NextResponse.json({ ok: false, error: "Missing token or signature" }, { status: 400 });
    }
    if (!signatureName || typeof signatureName !== "string" || !signatureName.trim()) {
      return NextResponse.json({ ok: false, error: "Missing token or signature" }, { status: 400 });
    }
    if (signatureName.trim().length > 200) {
      return NextResponse.json({ ok: false, error: "Signature name is too long (max 200 characters)" }, { status: 400 });
    }

    // Fetch token record FIRST — we need the stored password before calling signContract
    // (signContract marks it as signed, after which password retrieval still works but
    // we want it in hand before any state changes)
    const record = await getContractToken(token);
    if (!record) {
      return NextResponse.json(
        { ok: false, error: "Invalid or expired contract link." },
        { status: 404 }
      );
    }
    if (record.signed) {
      return NextResponse.json(
        { ok: false, error: "This contract has already been signed." },
        { status: 409 }
      );
    }
    if (new Date() > new Date(record.expiresAt)) {
      return NextResponse.json(
        { ok: false, error: "This contract link has expired. Please contact support@awakenbiolabs.com." },
        { status: 410 }
      );
    }

    const isReOnboard = record.isReOnboard ?? false;

    // Activate account + mark token signed
    const account = await signContract(token);
    if (!account) {
      return NextResponse.json(
        { ok: false, error: "Could not activate your account. Please contact support@awakenbiolabs.com." },
        { status: 500 }
      );
    }

    // For re-onboarding: send welcome-back email
    // For first-time: credentials were already emailed at approval — no action needed
    if (isReOnboard) {
      try {
        await sendWelcomeBackEmail({
          name: account.name,
          email: account.email,
          affiliateCode: account.affiliateCode,
          commissionRate: account.commissionRate,
        });
      } catch (emailErr) {
        console.error("[sign-contract] welcome-back email failed:", emailErr);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError("POST /api/affiliate/sign-contract", err);
  }
}
