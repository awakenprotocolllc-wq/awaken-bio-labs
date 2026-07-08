import { escape } from "./email";
import type { AcrItem } from "./abandoned-cart";

// =============================================================================
// Abandoned cart reminder templates (stages 1–3).
//
// Body HTML only — sendMarketingEmail() appends the CAN-SPAM footer (legal
// identity, postal address, unsubscribe link) and sets List-Unsubscribe
// headers. Do not add another footer here.
//
// Copy rules: prices/availability explicitly NOT guaranteed; no reservation
// implied; research-use framing preserved; the return link requires normal
// site authentication (no login bypass of any kind).
// =============================================================================

export function abandonedCartSubject(stage: number): string {
  switch (stage) {
    case 1:  return "You left items in your cart — Awaken Bio Labs";
    case 2:  return "Your research cart is still waiting — Awaken Bio Labs";
    default: return "Final reminder: your cart — Awaken Bio Labs";
  }
}

function stageIntro(stage: number, firstName: string): string {
  switch (stage) {
    case 1:
      return `Hi <strong style="color:#F4F4F2;">${escape(firstName)}</strong>,<br /><br />
        You added the items below to your cart but didn&apos;t complete checkout.
        They&apos;re saved to your account whenever you&apos;re ready.`;
    case 2:
      return `Hi <strong style="color:#F4F4F2;">${escape(firstName)}</strong>,<br /><br />
        A quick reminder — the items below are still in your cart. Pick up right
        where you left off.`;
    default:
      return `Hi <strong style="color:#F4F4F2;">${escape(firstName)}</strong>,<br /><br />
        This is our last reminder about the items in your cart. After this,
        we won&apos;t email you about this cart again.`;
  }
}

export function buildAbandonedCartHtml(args: {
  stage: number;
  firstName: string;
  items: AcrItem[];
  subtotal: string;
  returnUrl: string;
}): string {
  const { stage, firstName, items, subtotal, returnUrl } = args;

  const rows = items.map((item) => `
    <tr>
      <td style="padding:12px 14px;border-bottom:1px solid #2A2D33;color:#F4F4F2;font-family:'Courier New',monospace;font-size:13px;">${escape(item.product)}</td>
      <td style="padding:12px 14px;border-bottom:1px solid #2A2D33;color:#57C7D6;font-family:'Courier New',monospace;font-size:13px;text-align:center;">${escape(item.strength)}</td>
      <td style="padding:12px 14px;border-bottom:1px solid #2A2D33;color:#F4F4F2;font-family:'Courier New',monospace;font-size:13px;text-align:center;">${item.qty}</td>
      <td style="padding:12px 14px;border-bottom:1px solid #2A2D33;color:#57C7D6;font-family:'Courier New',monospace;font-size:13px;text-align:right;font-weight:bold;">${escape(item.price)}</td>
    </tr>`).join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#0A0B0D;">
<div style="background:#0A0B0D;color:#F4F4F2;font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 24px;">

  <div style="border-bottom:1px solid #2A2D33;padding-bottom:24px;margin-bottom:32px;">
    <p style="font-family:'Courier New',monospace;color:#57C7D6;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 12px;">AWAKEN BIO LABS</p>
    <h1 style="color:#F4F4F2;font-size:26px;margin:0;font-weight:700;">
      ${stage === 3 ? "Last call on your cart." : "Your cart is waiting."}
    </h1>
  </div>

  <p style="color:#D9D9DC;font-size:15px;line-height:1.7;margin:0 0 28px;">
    ${stageIntro(stage, firstName)}
  </p>

  <div style="background:#141518;border:1px solid #2A2D33;margin:0 0 24px;">
    <div style="padding:14px 16px;border-bottom:1px solid #2A2D33;">
      <p style="font-family:'Courier New',monospace;color:#57C7D6;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;margin:0;">— YOUR CART —</p>
    </div>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:#0A0B0D;">
          <th style="padding:10px 14px;text-align:left;color:#D9D9DC;font-size:10px;font-family:'Courier New',monospace;font-weight:normal;letter-spacing:0.15em;text-transform:uppercase;">Product</th>
          <th style="padding:10px 14px;text-align:center;color:#D9D9DC;font-size:10px;font-family:'Courier New',monospace;font-weight:normal;letter-spacing:0.15em;text-transform:uppercase;">Strength</th>
          <th style="padding:10px 14px;text-align:center;color:#D9D9DC;font-size:10px;font-family:'Courier New',monospace;font-weight:normal;letter-spacing:0.15em;text-transform:uppercase;">Qty</th>
          <th style="padding:10px 14px;text-align:right;color:#D9D9DC;font-size:10px;font-family:'Courier New',monospace;font-weight:normal;letter-spacing:0.15em;text-transform:uppercase;">Price</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="padding:12px 14px;border-top:1px solid #2A2D33;text-align:right;">
      <span style="font-family:'Courier New',monospace;color:#D9D9DC;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Subtotal&nbsp;&nbsp;</span>
      <span style="font-family:'Courier New',monospace;color:#57C7D6;font-size:18px;font-weight:bold;">${escape(subtotal)}</span>
    </div>
  </div>

  <div style="text-align:center;margin:0 0 24px;">
    <a href="${escape(returnUrl)}"
       style="display:inline-block;background:#57C7D6;color:#0A0B0D;font-weight:bold;font-size:15px;padding:14px 36px;text-decoration:none;">
      Return to Your Cart →
    </a>
    <p style="font-family:'Courier New',monospace;color:#8A8D93;font-size:11px;margin:14px 0 0;">
      You&apos;ll be asked to sign in to your account.
    </p>
  </div>

  <p style="font-family:'Courier New',monospace;color:#8A8D93;font-size:10px;line-height:1.7;margin:0;">
    Prices and availability shown are current as of this email and may change.
    Items are not reserved. All products are for in-vitro research use only —
    not for human or veterinary use.
  </p>

</div>
</body>
</html>`;
}
