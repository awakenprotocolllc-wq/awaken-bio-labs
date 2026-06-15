import { NextRequest, NextResponse } from "next/server";
import { sendEmail, escape } from "@/lib/email";
import { rateLimit, rateLimitBurst, clientIp } from "@/lib/rate-limit";
import { apiError } from "@/lib/api-error";
import { findAttack } from "@/lib/validate";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const VALID_REASONS = new Set([
  "Product question",
  "Order issue",
  "Wholesale inquiry",
  "Protocol guidance",
  "Other",
]);

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);

    // Hourly cap: 10 per hour
    const { allowed: hourlyOk } = await rateLimit(`contact:${ip}`, 10, 60 * 60);
    if (!hourlyOk) {
      return NextResponse.json({ ok: false, error: "Too many submissions. Try again later." }, { status: 429 });
    }
    // Burst cap: 10 per minute
    const { allowed: burstOk } = await rateLimitBurst(`contact:${ip}`);
    if (!burstOk) {
      return NextResponse.json({ ok: false, error: "Too many submissions. Slow down and try again." }, { status: 429 });
    }

    const data = await req.json();
    const { name, email, reason, message, website } = data ?? {};

    // Honeypot: bots fill this, humans don't
    if (website) {
      return NextResponse.json({ ok: true }); // silently discard bot submissions
    }

    if (!name || !email || !message) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (String(email).length > 254) {
      return NextResponse.json({ ok: false, error: "Email address is too long" }, { status: 400 });
    }
    if (!EMAIL_RE.test(String(email).trim())) {
      return NextResponse.json({ ok: false, error: "Invalid email address" }, { status: 400 });
    }
    if (String(name).length > 200) {
      return NextResponse.json({ ok: false, error: "Name is too long" }, { status: 400 });
    }
    if (String(message).length > 5000) {
      return NextResponse.json({ ok: false, error: "Message is too long (max 5000 characters)" }, { status: 400 });
    }
    const safeReason = VALID_REASONS.has(reason) ? reason : "Other";

    // Attack pattern detection
    const attackField = findAttack({ name: String(name), message: String(message) });
    if (attackField) {
      console.warn(`[contact] attack pattern in field "${attackField}", ip: ${ip}`);
      return NextResponse.json({ ok: false, error: "Submission rejected." }, { status: 400 });
    }

    // Strip CR/LF from name before inserting into email subject to prevent header injection
    const safeSubjectName = String(name).replace(/[\r\n]+/g, " ").trim();

    const html = `
      <h2>New Contact Form Submission</h2>
      <p><strong>From:</strong> ${escape(name)} &lt;${escape(email)}&gt;</p>
      <p><strong>Reason:</strong> ${escape(safeReason)}</p>
      <hr />
      <p style="white-space: pre-line;">${escape(message)}</p>
    `;

    const result = await sendEmail({
      subject: `[Awaken Contact] ${safeReason} — ${safeSubjectName}`,
      html,
      replyTo: email,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError("POST /api/contact", err);
  }
}
