// =============================================================================
// EMAIL DELIVERY — Resend
// =============================================================================
// Env vars required in Vercel project settings:
//   RESEND_API_KEY  = re_...
//   EMAIL_FROM      = noreply@awakenbiolabs.com  (must be on verified domain)
//   EMAIL_TO        = fallback recipient for contact form (default: support@awakenbiolabs.com)
// =============================================================================

type SendArgs = {
  to?: string;       // override recipient (defaults to EMAIL_TO env)
  subject: string;
  html: string;
  replyTo?: string;
};

export async function sendEmail({ to, subject, html, replyTo }: SendArgs) {
  const apiKey = process.env.RESEND_API_KEY;
  const recipient = to || process.env.EMAIL_TO || "support@awakenbiolabs.com";
  const from = process.env.EMAIL_FROM || "onboarding@resend.dev";

  if (!apiKey) {
    console.log("[email:fallback] No RESEND_API_KEY set. Would have sent:");
    console.log({ to: recipient, from, subject, replyTo });
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
      to: [recipient],
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
