import { sendEmail, escape } from "./email";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://awakenbiolabs.com";
const FROM_NAME = "Awaken Bio Labs";

// Shared dark-theme email wrapper
function wrap(content: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:0;background:#0A0B0D;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#D9D9DC}
  .wrap{max-width:560px;margin:0 auto;padding:40px 24px}
  .logo{font-family:monospace;font-size:11px;letter-spacing:.3em;color:#57C7D6;text-transform:uppercase;margin-bottom:32px}
  h1{font-size:26px;font-weight:700;color:#F4F4F2;margin:0 0 12px;line-height:1.2}
  p{font-size:14px;line-height:1.7;color:#D9D9DC;margin:0 0 16px}
  .btn{display:inline-block;background:#57C7D6;color:#0A0B0D;font-weight:600;font-size:14px;padding:14px 28px;text-decoration:none;margin:8px 0 24px}
  .code{font-family:monospace;font-size:22px;letter-spacing:.15em;color:#57C7D6;background:#141518;border:1px solid #2A2D33;padding:16px 24px;display:block;margin:8px 0 24px;text-align:center}
  .divider{border:none;border-top:1px solid #2A2D33;margin:28px 0}
  .small{font-size:12px;color:#8a8a8d;line-height:1.6}
  .footer{margin-top:40px;font-family:monospace;font-size:10px;color:#3a3a3d;letter-spacing:.1em}
</style></head><body>
<div class="wrap">
  <div class="logo">— Awaken Bio Labs —</div>
  ${content}
  <div class="footer">AWAKEN BIOLABS LLC · FOR IN-VITRO RESEARCH USE ONLY</div>
</div></body></html>`;
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const url = `${SITE}/account/verify-email?token=${token}`;
  await sendEmail({
    to,
    subject: `Verify your ${FROM_NAME} account`,
    html: wrap(`
      <h1>Verify your email</h1>
      <p>Hi ${escape(name)}, thanks for creating an account. Click below to verify your email address and activate your account.</p>
      <a href="${url}" class="btn">Verify Email Address</a>
      <hr class="divider">
      <p class="small">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
      <p class="small">If the button doesn't work, copy this URL: ${escape(url)}</p>
    `),
  });
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const url = `${SITE}/account/reset-password?token=${token}`;
  await sendEmail({
    to,
    subject: `Reset your ${FROM_NAME} password`,
    html: wrap(`
      <h1>Reset your password</h1>
      <p>Hi ${escape(name)}, we received a request to reset your password. Click below to choose a new one.</p>
      <a href="${url}" class="btn">Reset Password</a>
      <hr class="divider">
      <p class="small">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email — your password won't change.</p>
    `),
  });
}

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  await sendEmail({
    to,
    subject: `Welcome to ${FROM_NAME}`,
    html: wrap(`
      <h1>You're all set.</h1>
      <p>Hi ${escape(name)}, your account is verified and ready to go. You can now place orders, track your history, and save your shipping details.</p>
      <a href="${SITE}/shop" class="btn">Start Shopping</a>
      <hr class="divider">
      <p class="small">Questions? Reply to this email or reach us at <a href="mailto:support@awakenbiolabs.com" style="color:#57C7D6">support@awakenbiolabs.com</a>.</p>
    `),
  });
}

export async function sendAccountDeletionEmail(to: string, name: string): Promise<void> {
  await sendEmail({
    to,
    subject: `Your ${FROM_NAME} account has been deleted`,
    html: wrap(`
      <h1>Account deleted.</h1>
      <p>Hi ${escape(name)}, your account and all associated personal data have been permanently deleted as requested.</p>
      <p>Your order history has been anonymized and retained for legal and tax purposes.</p>
      <hr class="divider">
      <p class="small">If this was a mistake or you have questions, contact us at <a href="mailto:support@awakenbiolabs.com" style="color:#57C7D6">support@awakenbiolabs.com</a>.</p>
    `),
  });
}
