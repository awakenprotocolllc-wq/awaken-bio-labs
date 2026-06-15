import { NextRequest, NextResponse } from "next/server";
import { sendEmail, escape } from "@/lib/email";
import { createApplication } from "@/lib/affiliate-db";
import { sendApplicationReceivedEmail } from "@/lib/affiliate-emails";
import { rateLimit, rateLimitBurst, clientIp } from "@/lib/rate-limit";
import { apiError } from "@/lib/api-error";
import { findAttack } from "@/lib/validate";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);

    // Hourly cap: 5 applications per hour
    const { allowed: hourlyOk } = await rateLimit(`affiliate-apply:${ip}`, 5, 60 * 60);
    if (!hourlyOk) {
      return NextResponse.json({ ok: false, error: "Too many submissions. Try again later." }, { status: 429 });
    }
    // Burst cap: 10 per minute
    const { allowed: burstOk } = await rateLimitBurst(`affiliate-apply:${ip}`);
    if (!burstOk) {
      return NextResponse.json({ ok: false, error: "Too many submissions. Slow down and try again." }, { status: 429 });
    }

    const data = await req.json();
    const { name, email, platform, username, audience, about, programType, website } = data ?? {};

    // Honeypot: bots fill this, humans don't
    if (website) {
      return NextResponse.json({ ok: true }); // silently discard
    }

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
    if (username !== undefined && (typeof username !== "string" || username.length > 100)) {
      return NextResponse.json({ ok: false, error: "Username is too long (max 100 characters)" }, { status: 400 });
    }
    if (about !== undefined && (typeof about !== "string" || about.length > 2000)) {
      return NextResponse.json({ ok: false, error: "About section is too long (max 2000 characters)" }, { status: 400 });
    }
    if (audience !== undefined && (typeof audience !== "string" || audience.length > 500)) {
      return NextResponse.json({ ok: false, error: "Audience field is too long (max 500 characters)" }, { status: 400 });
    }

    // Attack pattern detection
    const attackField = findAttack({
      name: typeof name === "string" ? name : undefined,
      platform: typeof platform === "string" ? platform : undefined,
      audience: typeof audience === "string" ? audience : undefined,
      about: typeof about === "string" ? about : undefined,
    });
    if (attackField) {
      console.warn(`[affiliates] attack pattern in field "${attackField}", ip: ${ip}`);
      return NextResponse.json({ ok: false, error: "Submission rejected." }, { status: 400 });
    }

    const resolvedProgramType = programType === "licensee" ? "licensee" : "ambassador";

    // Save to KV so admin can review and approve
    await createApplication({ name, email, platform, username: username || undefined, audience, about, programType: resolvedProgramType });

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
      <p><strong>Username / Handle:</strong> ${escape(username || "—")}</p>
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
    return apiError("POST /api/affiliates", err);
  }
}
