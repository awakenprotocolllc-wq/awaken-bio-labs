import { NextRequest, NextResponse } from "next/server";
import { sendEmail, escape } from "@/lib/email";
import { createApplication } from "@/lib/affiliate-db";
import { sendApplicationReceivedEmail } from "@/lib/affiliate-emails";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    // 5 applications per hour per IP
    const { allowed } = await rateLimit(`affiliate-apply:${clientIp(req)}`, 5, 60 * 60);
    if (!allowed) {
      return NextResponse.json({ ok: false, error: "Too many submissions. Try again later." }, { status: 429 });
    }

    const data = await req.json();
    const { name, email, platform, audience, about, programType } = data ?? {};

    if (typeof name !== "string" || typeof email !== "string" || typeof platform !== "string") {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }
    if (!name.trim() || !email.trim() || !platform.trim()) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }
    if (!EMAIL_RE.test(email.trim())) {
      return NextResponse.json({ ok: false, error: "Invalid email address" }, { status: 400 });
    }
    if (name.length > 200) {
      return NextResponse.json({ ok: false, error: "Name is too long (max 200 characters)" }, { status: 400 });
    }
    if (platform.length > 200) {
      return NextResponse.json({ ok: false, error: "Platform is too long (max 200 characters)" }, { status: 400 });
    }
    if (about !== undefined && (typeof about !== "string" || about.length > 2000)) {
      return NextResponse.json({ ok: false, error: "About section is too long (max 2000 characters)" }, { status: 400 });
    }
    if (audience !== undefined && (typeof audience !== "string" || audience.length > 500)) {
      return NextResponse.json({ ok: false, error: "Audience field is too long (max 500 characters)" }, { status: 400 });
    }

    const resolvedProgramType = programType === "licensee" ? "licensee" : "ambassador";

    // Save to KV so admin can review and approve
    await createApplication({ name, email, platform, audience, about, programType: resolvedProgramType });

    // Send confirmation to applicant (non-blocking)
    sendApplicationReceivedEmail(name, email).catch((err) =>
      console.error("[affiliates] confirmation email error:", err)
    );

    // Also email admin
    const html = `
      <h2>New Affiliate Application</h2>
      <p><strong>Program:</strong> ${resolvedProgramType === "licensee" ? "⚡ LICENSEE" : "🤝 Ambassador"}</p>
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
