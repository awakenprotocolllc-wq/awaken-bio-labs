import { NextResponse } from "next/server";
import { sendEmail, escape } from "@/lib/email";
import { createApplication } from "@/lib/affiliate-db";
import { sendApplicationReceivedEmail } from "@/lib/affiliate-emails";

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

    // Save to KV so admin can review and approve
    await createApplication({ name, email, platform, audience, about });

    // Send confirmation to applicant (non-blocking)
    sendApplicationReceivedEmail(name, email).catch((err) =>
      console.error("[affiliates] confirmation email error:", err)
    );

    // Also email admin
    const html = `
      <h2>New Affiliate Application</h2>
      <p><strong>Name:</strong> ${escape(name)}</p>
      <p><strong>Email:</strong> ${escape(email)}</p>
      <p><strong>Platform:</strong> ${escape(platform)}</p>
      <p><strong>Audience size:</strong> ${escape(audience || "—")}</p>
      <hr />
      <p><strong>About their audience:</strong></p>
      <p style="white-space: pre-line;">${escape(about || "—")}</p>
      <p><a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://awakenbiolabs.com"}/admin/affiliates">Review in admin dashboard →</a></p>
    `;

    await sendEmail({
      subject: `[Awaken Affiliate] New application — ${name}`,
      html,
      replyTo: email,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/affiliates] error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
