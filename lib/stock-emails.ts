import { sendEmail, escape } from "./email";

// ---------------------------------------------------------------------------
// Customer notification — a product they subscribed to is back in stock
// ---------------------------------------------------------------------------

export async function sendBackInStockEmail(args: {
  to: string;
  customerName: string;
  productName: string;
  productUrl: string;
}) {
  const { to, customerName, productName, productUrl } = args;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#0A0B0D;">
<div style="background:#0A0B0D;color:#F4F4F2;font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 24px;">

  <!-- Header -->
  <div style="border-bottom:1px solid #2A2D33;padding-bottom:24px;margin-bottom:32px;">
    <p style="font-family:'Courier New',monospace;color:#57C7D6;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 12px;">AWAKEN BIO LABS</p>
    <h1 style="color:#F4F4F2;font-size:26px;margin:0;font-weight:700;">Back in Stock</h1>
  </div>

  <p style="color:#D9D9DC;font-size:15px;line-height:1.7;margin:0 0 28px;">
    Hi <strong style="color:#F4F4F2;">${escape(customerName)}</strong>,<br /><br />
    You asked us to let you know when <strong style="color:#57C7D6;">${escape(productName)}</strong>
    is available again — it&apos;s back in stock now.
  </p>

  <div style="background:#141518;border:1px solid #2A2D33;padding:24px;margin:0 0 28px;text-align:center;">
    <p style="font-family:'Courier New',monospace;color:#57C7D6;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 12px;">— NOW AVAILABLE —</p>
    <p style="color:#F4F4F2;font-size:20px;font-weight:700;margin:0 0 20px;">${escape(productName)}</p>
    <a href="${escape(productUrl)}"
       style="display:inline-block;background:#57C7D6;color:#0A0B0D;font-weight:bold;font-size:14px;padding:14px 32px;text-decoration:none;">
      View Product →
    </a>
    <p style="font-family:'Courier New',monospace;color:#D9D9DC;font-size:10px;margin:16px 0 0;opacity:0.7;">
      Inventory is limited — availability is not guaranteed.
    </p>
  </div>

  <!-- Footer -->
  <div style="border-top:1px solid #2A2D33;padding-top:24px;margin-top:8px;">
    <p style="font-family:'Courier New',monospace;color:#D9D9DC;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 8px;">Questions?</p>
    <p style="font-family:'Courier New',monospace;color:#57C7D6;font-size:11px;margin:0 0 16px;">
      Reply to this email or contact <a href="mailto:support@awakenbiolabs.com" style="color:#57C7D6;">support@awakenbiolabs.com</a>
    </p>
    <p style="font-family:'Courier New',monospace;color:#2A2D33;font-size:10px;line-height:1.6;margin:0;">
      FOR RESEARCH USE ONLY. NOT FOR HUMAN OR VETERINARY USE. IN-VITRO USE ONLY.<br />
      Awaken Biolabs LLC · Las Vegas, NV<br /><br />
      You received this one-time notification because you requested a restock alert for this product.
    </p>
  </div>

</div>
</body>
</html>`;

  return sendEmail({
    to,
    subject: `Back in Stock — ${productName} | Awaken Bio Labs`,
    html,
    replyTo: "support@awakenbiolabs.com",
  });
}
