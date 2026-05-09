import { sendEmail, escape } from "./email";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://awakenbiolabs.com";
const SUPPORT = "support@awakenbiolabs.com";

// ---------------------------------------------------------------------------
// 1. Application received — sent to the applicant
// ---------------------------------------------------------------------------
export async function sendApplicationReceivedEmail(name: string, email: string) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0B0D;font-family:'Helvetica Neue',Arial,sans-serif;color:#E8E6E1;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0B0D;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

        <!-- Logo bar -->
        <tr><td style="padding-bottom:32px;">
          <p style="margin:0;font-family:monospace;font-size:11px;letter-spacing:0.2em;color:#57C7D6;text-transform:uppercase;">
            — AWAKEN BIO LABS —
          </p>
        </td></tr>

        <!-- Heading -->
        <tr><td style="border-left:2px solid #57C7D6;padding-left:20px;padding-bottom:32px;">
          <h1 style="margin:0;font-size:28px;font-weight:700;color:#F5F3EF;line-height:1.1;letter-spacing:-0.02em;">
            Application received.
          </h1>
          <p style="margin:12px 0 0;font-size:15px;color:#A09E9A;line-height:1.6;">
            Hi ${escape(name)}, thanks for applying to the Awaken Bio Labs partner program.
          </p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding-bottom:32px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#141517;border:1px solid #2A2B2F;padding:28px;">
            <tr><td>
              <p style="margin:0 0 16px;font-size:14px;color:#A09E9A;line-height:1.7;">
                We review every application personally. You can expect a response within
                <strong style="color:#E8E6E1;">48 hours</strong> at this email address.
              </p>
              <p style="margin:0;font-size:14px;color:#A09E9A;line-height:1.7;">
                In the meantime, if you have any questions reach us at
                <a href="mailto:${SUPPORT}" style="color:#57C7D6;text-decoration:none;">${SUPPORT}</a>.
              </p>
            </td></tr>
          </table>
        </td></tr>

        <!-- What happens next -->
        <tr><td style="padding-bottom:32px;">
          <p style="margin:0 0 16px;font-family:monospace;font-size:10px;letter-spacing:0.2em;color:#57C7D6;text-transform:uppercase;">
            — WHAT HAPPENS NEXT —
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${[
              ["Review", "Our team checks your platform and audience fit."],
              ["Approval email", "If approved, you'll receive login credentials and your unique tracking code."],
              ["Start earning", "Share your link. Earn 25% commission on every referred sale."],
            ]
              .map(
                ([step, desc], i) => `
            <tr>
              <td style="padding:12px 0;border-top:1px solid #2A2B2F;">
                <p style="margin:0;font-family:monospace;font-size:10px;color:#57C7D6;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:4px;">
                  0${i + 1} — ${step}
                </p>
                <p style="margin:0;font-size:13px;color:#A09E9A;line-height:1.6;">${desc}</p>
              </td>
            </tr>`
              )
              .join("")}
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="border-top:1px solid #2A2B2F;padding-top:24px;">
          <p style="margin:0;font-family:monospace;font-size:10px;color:#5A5856;letter-spacing:0.15em;text-transform:uppercase;line-height:1.8;">
            AWAKEN BIO LABS LLC · FOR IN-VITRO RESEARCH USE ONLY<br>
            NOT FOR HUMAN OR VETERINARY USE
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendEmail({
    to: email,
    subject: "Your affiliate application is under review — Awaken Bio Labs",
    html,
    replyTo: SUPPORT,
  });
}

// ---------------------------------------------------------------------------
// 2. Affiliate approved — sent to the new affiliate with their credentials
// ---------------------------------------------------------------------------
export async function sendAffiliateApprovedEmail({
  name,
  email,
  affiliateCode,
  password,
  commissionRate,
}: {
  name: string;
  email: string;
  affiliateCode: string;
  password: string;
  commissionRate: number;
}) {
  const loginUrl = `${SITE}/affiliates/login`;
  const dashboardUrl = `${SITE}/affiliates/dashboard`;
  const commissionPct = Math.round(commissionRate * 100);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0B0D;font-family:'Helvetica Neue',Arial,sans-serif;color:#E8E6E1;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0B0D;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

        <!-- Logo bar -->
        <tr><td style="padding-bottom:32px;">
          <p style="margin:0;font-family:monospace;font-size:11px;letter-spacing:0.2em;color:#57C7D6;text-transform:uppercase;">
            — AWAKEN BIO LABS —
          </p>
        </td></tr>

        <!-- Heading -->
        <tr><td style="border-left:2px solid #57C7D6;padding-left:20px;padding-bottom:32px;">
          <h1 style="margin:0;font-size:28px;font-weight:700;color:#F5F3EF;line-height:1.1;letter-spacing:-0.02em;">
            You're approved.
          </h1>
          <p style="margin:12px 0 0;font-size:15px;color:#A09E9A;line-height:1.6;">
            Welcome to the Awaken Bio Labs partner program, ${escape(name)}.
            Here are your credentials — keep them safe.
          </p>
        </td></tr>

        <!-- Credentials box -->
        <tr><td style="padding-bottom:32px;">
          <p style="margin:0 0 12px;font-family:monospace;font-size:10px;letter-spacing:0.2em;color:#57C7D6;text-transform:uppercase;">
            — YOUR LOGIN CREDENTIALS —
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#141517;border:1px solid #57C7D6;padding:24px;">
            <tr><td>
              ${[
                ["Login URL", `<a href="${loginUrl}" style="color:#57C7D6;text-decoration:none;">${loginUrl}</a>`],
                ["Email", escape(email)],
                ["Password", `<span style="font-family:monospace;background:#0A0B0D;padding:2px 8px;border:1px solid #2A2B2F;color:#F5F3EF;">${escape(password)}</span>`],
                ["Affiliate Code", `<span style="font-family:monospace;font-size:18px;font-weight:700;color:#57C7D6;letter-spacing:0.1em;">${escape(affiliateCode)}</span>`],
                ["Commission", `<strong style="color:#57C7D6;">${commissionPct}%</strong> per referred sale`],
              ]
                .map(
                  ([label, value]) => `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td style="font-family:monospace;font-size:10px;color:#5A5856;letter-spacing:0.15em;text-transform:uppercase;padding-bottom:4px;">${label}</td>
                </tr>
                <tr>
                  <td style="font-size:14px;color:#E8E6E1;">${value}</td>
                </tr>
              </table>`
                )
                .join("")}
            </td></tr>
          </table>
        </td></tr>

        <!-- Tracking link -->
        <tr><td style="padding-bottom:32px;">
          <p style="margin:0 0 12px;font-family:monospace;font-size:10px;letter-spacing:0.2em;color:#57C7D6;text-transform:uppercase;">
            — YOUR TRACKING LINK —
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#141517;border:1px solid #2A2B2F;padding:20px;">
            <tr><td>
              <p style="margin:0 0 8px;font-family:monospace;font-size:13px;color:#57C7D6;word-break:break-all;">
                ${SITE}/shop?ref=${escape(affiliateCode)}
              </p>
              <p style="margin:0;font-size:12px;color:#5A5856;line-height:1.6;">
                Append <code style="font-family:monospace;color:#57C7D6;">?ref=${escape(affiliateCode)}</code> to any
                page on awakenbiolabs.com. 60-day cookie window.
                More links available in your dashboard.
              </p>
            </td></tr>
          </table>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding-bottom:32px;text-align:center;">
          <a href="${dashboardUrl}"
            style="display:inline-block;background:#57C7D6;color:#0A0B0D;font-weight:700;font-size:14px;
                   text-decoration:none;padding:14px 36px;letter-spacing:0.02em;">
            Go to Your Dashboard →
          </a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="border-top:1px solid #2A2B2F;padding-top:24px;">
          <p style="margin:0;font-family:monospace;font-size:10px;color:#5A5856;letter-spacing:0.15em;text-transform:uppercase;line-height:1.8;">
            AWAKEN BIO LABS LLC · FOR IN-VITRO RESEARCH USE ONLY<br>
            Questions? <a href="mailto:${SUPPORT}" style="color:#5A5856;">${SUPPORT}</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendEmail({
    to: email,
    subject: `You're approved — welcome to the Awaken Bio Labs affiliate program`,
    html,
    replyTo: SUPPORT,
  });
}
