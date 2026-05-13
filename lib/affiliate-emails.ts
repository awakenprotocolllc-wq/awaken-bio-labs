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
              ["Approval email", "If approved, you'll receive a contract to sign digitally — takes under a minute."],
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
// 2. Contract signing request — sent on approval BEFORE credentials
// ---------------------------------------------------------------------------
export async function sendContractSigningEmail({
  name,
  email,
  contractUrl,
  commissionRate,
}: {
  name: string;
  email: string;
  contractUrl: string;
  commissionRate: number;
}) {
  const commissionPct = Math.round(commissionRate * 100);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0B0D;font-family:'Helvetica Neue',Arial,sans-serif;color:#E8E6E1;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0B0D;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">
        <tr><td style="padding-bottom:32px;">
          <p style="margin:0;font-family:monospace;font-size:11px;letter-spacing:0.2em;color:#57C7D6;text-transform:uppercase;">— AWAKEN BIO LABS —</p>
        </td></tr>
        <tr><td style="border-left:2px solid #57C7D6;padding-left:20px;padding-bottom:32px;">
          <h1 style="margin:0;font-size:28px;font-weight:700;color:#F5F3EF;line-height:1.1;letter-spacing:-0.02em;">You're approved.<br>One last step.</h1>
          <p style="margin:12px 0 0;font-size:15px;color:#A09E9A;line-height:1.6;">
            Congratulations ${escape(name)} — your application has been approved. Before we send your login credentials,
            please review and sign your Affiliate Agreement. It takes under a minute.
          </p>
        </td></tr>
        <tr><td style="padding-bottom:32px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#141517;border:1px solid #2A2B2F;padding:24px;">
            <tr><td>
              <p style="margin:0 0 6px;font-family:monospace;font-size:10px;color:#5A5856;letter-spacing:0.15em;text-transform:uppercase;">Commission Rate</p>
              <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#57C7D6;">${commissionPct}% per fulfilled sale</p>
              <p style="margin:0 0 6px;font-family:monospace;font-size:10px;color:#5A5856;letter-spacing:0.15em;text-transform:uppercase;">Customer Discount</p>
              <p style="margin:0;font-size:20px;font-weight:700;color:#57C7D6;">10% off with your code</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding-bottom:32px;text-align:center;">
          <a href="${contractUrl}" style="display:inline-block;background:#57C7D6;color:#0A0B0D;font-weight:700;font-size:15px;text-decoration:none;padding:16px 40px;letter-spacing:0.02em;">
            Review &amp; Sign Agreement →
          </a>
          <p style="margin:16px 0 0;font-family:monospace;font-size:10px;color:#5A5856;text-align:center;">This link expires in 7 days.</p>
        </td></tr>
        <tr><td style="border-top:1px solid #2A2B2F;padding-top:24px;">
          <p style="margin:0;font-family:monospace;font-size:10px;color:#5A5856;letter-spacing:0.15em;text-transform:uppercase;line-height:1.8;">
            AWAKEN BIO LABS LLC · Questions? <a href="mailto:${SUPPORT}" style="color:#5A5856;">${SUPPORT}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendEmail({
    to: email,
    subject: "You're approved — sign your affiliate agreement to get started",
    html,
    replyTo: SUPPORT,
  });
}

// ---------------------------------------------------------------------------
// 3. Credentials — sent AFTER contract is signed
// ---------------------------------------------------------------------------
export async function sendCredentialsEmail({
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
        <tr><td style="padding-bottom:32px;">
          <p style="margin:0;font-family:monospace;font-size:11px;letter-spacing:0.2em;color:#57C7D6;text-transform:uppercase;">— AWAKEN BIO LABS —</p>
        </td></tr>
        <tr><td style="border-left:2px solid #57C7D6;padding-left:20px;padding-bottom:32px;">
          <h1 style="margin:0;font-size:28px;font-weight:700;color:#F5F3EF;line-height:1.1;letter-spacing:-0.02em;">Welcome aboard, ${escape(name)}.</h1>
          <p style="margin:12px 0 0;font-size:15px;color:#A09E9A;line-height:1.6;">Agreement signed. Here are your login credentials and tracking details — keep them safe.</p>
        </td></tr>

        <!-- Credentials -->
        <tr><td style="padding-bottom:24px;">
          <p style="margin:0 0 12px;font-family:monospace;font-size:10px;letter-spacing:0.2em;color:#57C7D6;text-transform:uppercase;">— YOUR LOGIN —</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#141517;border:1px solid #57C7D6;padding:24px;">
            <tr><td>
              ${[
                ["Login URL", `<a href="${loginUrl}" style="color:#57C7D6;text-decoration:none;">${loginUrl}</a>`],
                ["Email", escape(email)],
                ["Password", `<code style="font-family:monospace;background:#0A0B0D;padding:3px 10px;border:1px solid #2A2B2F;color:#F5F3EF;">${escape(password)}</code>`],
              ].map(([label, value]) => `
              <p style="margin:0 0 4px;font-family:monospace;font-size:10px;color:#5A5856;letter-spacing:0.15em;text-transform:uppercase;">${label}</p>
              <p style="margin:0 0 16px;font-size:14px;color:#E8E6E1;">${value}</p>`).join("")}
            </td></tr>
          </table>
        </td></tr>

        <!-- Affiliate code -->
        <tr><td style="padding-bottom:24px;">
          <p style="margin:0 0 12px;font-family:monospace;font-size:10px;letter-spacing:0.2em;color:#57C7D6;text-transform:uppercase;">— YOUR AFFILIATE CODE —</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#141517;border:1px solid #2A2B2F;padding:24px;">
            <tr><td>
              <p style="margin:0 0 4px;font-size:32px;font-weight:700;font-family:monospace;color:#57C7D6;letter-spacing:0.15em;">${escape(affiliateCode)}</p>
              <p style="margin:0 0 16px;font-size:13px;color:#A09E9A;">Share this code. Customers get <strong style="color:#F5F3EF;">10% off</strong>. You earn <strong style="color:#57C7D6;">${commissionPct}%</strong> commission on every fulfilled order.</p>
              <p style="margin:0 0 6px;font-family:monospace;font-size:10px;color:#5A5856;letter-spacing:0.15em;text-transform:uppercase;">Your tracking link</p>
              <p style="margin:0;font-family:monospace;font-size:12px;color:#57C7D6;word-break:break-all;">${SITE}/shop?ref=${escape(affiliateCode)}</p>
            </td></tr>
          </table>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding-bottom:32px;text-align:center;">
          <a href="${dashboardUrl}" style="display:inline-block;background:#57C7D6;color:#0A0B0D;font-weight:700;font-size:14px;text-decoration:none;padding:14px 36px;letter-spacing:0.02em;">
            Go to Your Dashboard →
          </a>
        </td></tr>

        <tr><td style="border-top:1px solid #2A2B2F;padding-top:24px;">
          <p style="margin:0;font-family:monospace;font-size:10px;color:#5A5856;letter-spacing:0.15em;text-transform:uppercase;line-height:1.8;">
            AWAKEN BIO LABS LLC · Questions? <a href="mailto:${SUPPORT}" style="color:#5A5856;">${SUPPORT}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendEmail({
    to: email,
    subject: "Your Awaken Bio Labs affiliate account is ready",
    html,
    replyTo: SUPPORT,
  });
}
