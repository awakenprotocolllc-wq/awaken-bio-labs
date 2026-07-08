import { NextRequest, NextResponse } from "next/server";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-token";
import { subscribeMarketing } from "@/lib/marketing-consent";

// GET /api/marketing/confirm?token=… — re-permission confirmation link.
// Verifies a purpose-bound "confirm" token, records the subscription, and
// redirects to the confirmation page. Clicking the link IS the affirmative
// act of consent; the token proves the click came from the email we sent.
export async function GET(req: NextRequest) {
  const dest = req.nextUrl.clone();
  dest.pathname = "/marketing-confirmed";

  try {
    const token = req.nextUrl.searchParams.get("token") ?? "";
    const verification = verifyUnsubscribeToken(token, "confirm");

    if (!verification.valid) {
      dest.search = "?error=1";
      return NextResponse.redirect(dest);
    }

    const result = await subscribeMarketing(verification.email, {
      source: "repermission_confirm",
      consentDisclosureVersion: "2026-06-repermission-v1",
      actor: "email_confirm_link",
    });

    // Blocked means they unsubscribed or were suppressed AFTER we sent the
    // re-permission email — honor the stricter state, never override it.
    dest.search = result.ok ? "?ok=1" : "?blocked=1";
    return NextResponse.redirect(dest);
  } catch (err) {
    console.error("[GET /api/marketing/confirm]", err);
    dest.search = "?error=1";
    return NextResponse.redirect(dest);
  }
}
