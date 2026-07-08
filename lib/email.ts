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
  /** Custom SMTP headers (e.g. List-Unsubscribe). Passed through to Resend. */
  headers?: Record<string, string>;
  /** Override the From identity (e.g. dedicated marketing sender). */
  fromOverride?: string;
};

export async function sendEmail({ to, subject, html, replyTo, headers, fromOverride }: SendArgs) {
  const apiKey = process.env.RESEND_API_KEY;
  const recipient = to || process.env.EMAIL_TO || "support@awakenbiolabs.com";
  const from = fromOverride || process.env.EMAIL_FROM || "onboarding@resend.dev";

  if (!apiKey) {
    console.log("[email:fallback] No RESEND_API_KEY set — email suppressed (set env var to enable delivery)");
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
      ...(headers && Object.keys(headers).length > 0 ? { headers } : {}),
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
