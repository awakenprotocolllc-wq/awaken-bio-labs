import { NextRequest, NextResponse } from "next/server";
import { sendEmail, escape } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/rate-limit";

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
    // 10 submissions per hour per IP
    const { allowed } = await rateLimit(`contact:${clientIp(req)}`, 10, 60 * 60);
    if (!allowed) {
      return NextResponse.json({ ok: false, error: "Too many submissions. Try again later." }, { status: 429 });
    }

    const data = await req.json();
    const { name, email, reason, message } = data ?? {};

    if (!name || !email || !message) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
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

    const html = `
      <h2>New Contact Form Submission</h2>
      <p><strong>From:</strong> ${escape(name)} &lt;${escape(email)}&gt;</p>
      <p><strong>Reason:</strong> ${escape(safeReason)}</p>
      <hr />
      <p style="white-space: pre-line;">${escape(message)}</p>
    `;

    const result = await sendEmail({
      subject: `[Awaken Contact] ${safeReason} — ${name}`,
      html,
      replyTo: email,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/contact] error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
