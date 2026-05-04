import { NextResponse } from "next/server";
import { sendEmail, escape } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { name, email, reason, message } = data ?? {};

    if (!name || !email || !message) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const html = `
      <h2>New Contact Form Submission</h2>
      <p><strong>From:</strong> ${escape(name)} &lt;${escape(email)}&gt;</p>
      <p><strong>Reason:</strong> ${escape(reason || "—")}</p>
      <hr />
      <p style="white-space: pre-line;">${escape(message)}</p>
    `;

    const result = await sendEmail({
      subject: `[Awaken Contact] ${reason || "New message"} — ${name}`,
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
