import { NextRequest, NextResponse } from "next/server";
import { createPasswordResetToken, getAffiliateById } from "@/lib/affiliate-db";
import { sendPasswordResetEmail } from "@/lib/affiliate-emails";
import { kv } from "@vercel/kv";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://awakenbiolabs.com";

// POST /api/affiliate/forgot-password
// body: { email: string }
// Always returns { ok: true } — never reveal whether email exists
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ ok: false, error: "Missing email" }, { status: 400 });
    }

    const token = await createPasswordResetToken(email.trim().toLowerCase());

    if (token) {
      // Fetch the affiliate name for the email greeting
      const id = await kv.get<string>(`aff:email:${email.trim().toLowerCase()}`);
      const account = id ? await getAffiliateById(id) : null;
      const name = account?.name ?? "there";
      const resetUrl = `${SITE}/affiliates/reset-password?token=${token}`;

      try {
        await sendPasswordResetEmail({ name, email: email.trim().toLowerCase(), resetUrl });
      } catch (emailErr) {
        console.error("[forgot-password] email send failed:", emailErr);
      }
    }

    // Always return success — don't leak whether the email is registered
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/affiliate/forgot-password]", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
