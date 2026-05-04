import { NextResponse } from "next/server";
import { sendEmail, escape } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { name, email, platform, audience, about } = data ?? {};

    if (!name || !email || !platform) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const html = `
      <h2>New Affiliate Application</h2>
      <p><strong>Name:</strong> ${escape(name)}</p>
      <p><strong>Email:</strong> ${escape(email)}</p>
      <p><strong>Platform:</strong> ${escape(platform)}</p>
      <p><strong>Audience size:</strong> ${escape(audience || "—")}</p>
      <hr />
      <p><strong>About their audience:</strong></p>
      <p style="white-space: pre-line;">${escape(about || "—")}</p>
    `;

    const result = await sendEmail({
      subject: `[Awaken Affiliate] New application — ${name}`,
      html,
      replyTo: email,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/affiliates] error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
