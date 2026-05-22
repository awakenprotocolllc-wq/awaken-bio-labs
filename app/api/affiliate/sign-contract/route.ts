import { NextRequest, NextResponse } from "next/server";
import { getContractToken, signContract } from "@/lib/affiliate-db";
import { sendCredentialsEmail, sendWelcomeBackEmail } from "@/lib/affiliate-emails";

// POST /api/affiliate/sign-contract
// body: { token: string; signatureName: string }
export async function POST(req: NextRequest) {
  try {
    const { token, signatureName } = await req.json();

    if (!token || !signatureName?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Missing token or signature" },
        { status: 400 }
      );
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

    // Capture fields before signContract mutates the record
    const storedPassword = record.password;
    const isReOnboard = record.isReOnboard ?? false;

    // Activate account + mark token signed
    const account = await signContract(token);
    if (!account) {
      return NextResponse.json(
        { ok: false, error: "Could not activate your account. Please contact support@awakenbiolabs.com." },
        { status: 500 }
      );
    }

    // Send appropriate email — do NOT fire-and-forget on Vercel
    try {
      if (isReOnboard) {
        // Re-onboarding: they already have credentials — just send welcome back
        await sendWelcomeBackEmail({
          name: account.name,
          email: account.email,
          affiliateCode: account.affiliateCode,
          commissionRate: account.commissionRate,
        });
      } else {
        // First-time: send full credentials
        await sendCredentialsEmail({
          name: account.name,
          email: account.email,
          affiliateCode: account.affiliateCode,
          password: storedPassword,
          commissionRate: account.commissionRate,
        });
      }
    } catch (emailErr) {
      console.error("[sign-contract] email failed:", emailErr);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/affiliate/sign-contract]", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
