/**
 * Admin email test — sends a test transactional email and returns the raw
 * Resend API response so you can see exactly why delivery is failing.
 * Admin-authenticated only.
 */
import { NextRequest, NextResponse } from "next/server";
import { validateAdminSession } from "@/lib/admin-auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { apiError } from "@/lib/api-error";

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const context = { ip, ua: req.headers.get("user-agent") ?? "" };
    const token = req.cookies.get("awaken_admin")?.value;
    if (!(await validateAdminSession(token, context))) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { allowed } = await rateLimit(`admin:test-email:${ip}`, 10, 60 * 60);
    if (!allowed) return NextResponse.json({ ok: false, error: "Too many test emails. Try again later." }, { status: 429 });

    const body = await req.json().catch(() => ({}));
    const to: string = (body.to ?? "").trim();
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json({ ok: false, error: "Valid 'to' email required." }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from   = process.env.EMAIL_FROM || "onboarding@resend.dev";

    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "RESEND_API_KEY is not set in Vercel env vars.", envCheck: { RESEND_API_KEY: "missing", EMAIL_FROM: from } });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        subject: "Awaken Bio Labs — email delivery test",
        html: "<p>This is a test email from the admin dashboard. If you received this, Resend is configured correctly.</p>",
      }),
    });

    const resBody = await res.text();
    let parsed: unknown;
    try { parsed = JSON.parse(resBody); } catch { parsed = resBody; }

    return NextResponse.json({
      ok: res.ok,
      httpStatus: res.status,
      resendResponse: parsed,
      config: { from, apiKeySet: true },
    });
  } catch (err) {
    return apiError("admin:test-email", err);
  }
}
