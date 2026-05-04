// =============================================================================
// EMAIL DELIVERY
// =============================================================================
// If RESEND_API_KEY is set in env (Vercel project settings → Environment
// Variables), submissions are sent via Resend. Otherwise we log them to the
// server console — useful for local dev and so the form still works without
// keys configured.
//
// To enable real email delivery:
//   1. Sign up at resend.com (free tier: 3000 emails/mo)
//   2. Verify a sending domain (or use onboarding@resend.dev for testing)
//   3. Get an API key from resend.com/api-keys
//   4. In Vercel: Project → Settings → Environment Variables, add:
//        RESEND_API_KEY = re_...
//        EMAIL_TO       = your_inbox@gmail.com
//        EMAIL_FROM     = noreply@awakenbiolabs.com   (must be on verified domain)
//   5. Redeploy.
// =============================================================================

type SendArgs = {
  subject: string;
  html: string;
  replyTo?: string;
};

export async function sendEmail({ subject, html, replyTo }: SendArgs) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.EMAIL_TO || "support@awakenbiolabs.com";
  const from = process.env.EMAIL_FROM || "onboarding@resend.dev";

  if (!apiKey) {
    // Dev / unconfigured fallback — still "succeeds" so the UI flow works.
    console.log("[email:fallback] No RESEND_API_KEY set. Would have sent:");
    console.log({ to, from, subject, replyTo, html });
    return { ok: true, fallback: true };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      reply_to: replyTo,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[email:resend] Failed:", res.status, text);
    return { ok: false, error: text };
  }

  return { ok: true };
}

export function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
