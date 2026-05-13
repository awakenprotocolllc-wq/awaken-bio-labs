import { NextRequest, NextResponse } from "next/server";
import { getContractToken, signContract } from "@/lib/affiliate-db";
import { sendCredentialsEmail } from "@/lib/affiliate-emails";

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

    // Fetch the token record first (we need the stored password before signing)
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
        { ok: false, error: "This contract link has expired. Please contact support." },
        { status: 410 }
      );
    }

    // Activate account + mark token as signed
    const account = await signContract(token);
    if (!account) {
      return NextResponse.json(
        { ok: false, error: "Could not activate account. Please contact support." },
        { status: 500 }
      );
    }

    // Send credentials email now that contract is signed (non-blocking)
    sendCredentialsEmail({
      name: account.name,
      email: account.email,
      affiliateCode: account.affiliateCode,
      password: record.password,
      commissionRate: account.commissionRate,
    }).catch((err) => console.error("[sign-contract] credentials email error:", err));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/affiliate/sign-contract]", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
