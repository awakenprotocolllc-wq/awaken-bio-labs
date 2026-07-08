import { NextRequest, NextResponse } from "next/server";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-token";
import { unsubscribeMarketing } from "@/lib/marketing-consent";

// =============================================================================
// Unsubscribe endpoint.
//
// POST — RFC 8058 one-click unsubscribe (mail clients call this from the
//        List-Unsubscribe-Post header). No login, no confirmation step.
// GET  — direct link fallback; processes then redirects to the confirmation
//        page at /unsubscribe.
//
// Deliberately NOT rate-limited: an opt-out must never be dropped because of
// throttling. Abuse is bounded by the HMAC token requirement — requests
// without a validly signed token do nothing.
//
// CSRF note: exempted from the middleware Origin check (mail clients POST
// without a browser Origin). The action is safe to trigger cross-origin: it
// only ever *removes* the address from marketing, is idempotent, and requires
// a signed token.
// =============================================================================

async function processToken(token: string): Promise<{ ok: boolean; status: number }> {
  const verification = verifyUnsubscribeToken(token);

  if (!verification.valid) {
    if (verification.reason === "not_configured") {
      console.error("[unsubscribe] UNSUBSCRIBE_TOKEN_SECRET not configured — cannot verify tokens");
      return { ok: false, status: 500 };
    }
    return { ok: false, status: 400 };
  }

  // Idempotent — repeated requests are safe; unsubscribeMarketing never
  // downgrades a stricter suppression state.
  await unsubscribeMarketing(verification.email, { source: "one_click" });
  return { ok: true, status: 200 };
}

export async function POST(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token") ?? "";
    const result = await processToken(token);
    if (!result.ok) {
      return NextResponse.json({ ok: false }, { status: result.status });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    // Never leave a valid unsubscribe silently unprocessed without signal
    console.error("[POST /api/marketing/unsubscribe]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token") ?? "";
    const result = await processToken(token);
    const dest = req.nextUrl.clone();
    dest.pathname = "/unsubscribe";
    dest.search = result.ok ? "?done=1" : "?error=1";
    return NextResponse.redirect(dest);
  } catch (err) {
    console.error("[GET /api/marketing/unsubscribe]", err);
    const dest = req.nextUrl.clone();
    dest.pathname = "/unsubscribe";
    dest.search = "?error=1";
    return NextResponse.redirect(dest);
  }
}
