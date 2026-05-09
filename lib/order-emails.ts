import { sendEmail } from "./email";
import { type Order } from "./db";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function itemsRowsCustomer(items: Order["items"]): string {
  return items
    .map(
      (item) => `
    <tr>
      <td style="padding:12px 14px;border-bottom:1px solid #2A2D33;color:#F4F4F2;font-family:'Courier New',monospace;font-size:13px;">${item.product}</td>
      <td style="padding:12px 14px;border-bottom:1px solid #2A2D33;color:#57C7D6;font-family:'Courier New',monospace;font-size:13px;text-align:center;">${item.strength}</td>
      <td style="padding:12px 14px;border-bottom:1px solid #2A2D33;color:#F4F4F2;font-family:'Courier New',monospace;font-size:13px;text-align:center;">${item.qty}</td>
      <td style="padding:12px 14px;border-bottom:1px solid #2A2D33;color:#57C7D6;font-family:'Courier New',monospace;font-size:13px;text-align:right;font-weight:bold;">${item.price}</td>
    </tr>`
    )
    .join("");
}

function itemsRowsAdmin(items: Order["items"]): string {
  return items
    .map(
      (item) => `
    <tr>
      <td style="padding:8px 12px;border:1px solid #ddd;">${item.product}</td>
      <td style="padding:8px 12px;border:1px solid #ddd;text-align:center;">${item.strength}</td>
      <td style="padding:8px 12px;border:1px solid #ddd;text-align:center;">${item.qty}</td>
      <td style="padding:8px 12px;border:1px solid #ddd;text-align:right;font-weight:bold;">${item.price}</td>
    </tr>`
    )
    .join("");
}

// ---------------------------------------------------------------------------
// Customer email — payment instructions
// ---------------------------------------------------------------------------

export async function sendCustomerOrderEmail(order: Order) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://awakenbiolabs.com";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#0A0B0D;">
<div style="background:#0A0B0D;color:#F4F4F2;font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 24px;">

  <!-- Header -->
  <div style="border-bottom:1px solid #2A2D33;padding-bottom:24px;margin-bottom:32px;">
    <p style="font-family:'Courier New',monospace;color:#57C7D6;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 12px;">AWAKEN BIO LABS</p>
    <h1 style="color:#F4F4F2;font-size:26px;margin:0 0 8px;font-weight:700;">Order Received</h1>
    <p style="font-family:'Courier New',monospace;color:#D9D9DC;font-size:12px;margin:0;">
      Order <strong style="color:#57C7D6;">#${order.id.toUpperCase()}</strong>
      &nbsp;·&nbsp;
      ${new Date(order.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
    </p>
  </div>

  <p style="color:#D9D9DC;font-size:15px;line-height:1.7;margin:0 0 20px;">
    Hi <strong style="color:#F4F4F2;">${order.customer.name}</strong>,<br /><br />
    Thank you for your order. To complete your purchase, please send the exact total below via <strong style="color:#F4F4F2;">Zelle</strong>. Your order will be fulfilled once we confirm receipt of payment — typically within 1 business day.
  </p>

  <!-- Order Summary -->
  <div style="background:#141518;border:1px solid #2A2D33;margin:0 0 24px;">
    <div style="padding:14px 16px;border-bottom:1px solid #2A2D33;">
      <p style="font-family:'Courier New',monospace;color:#57C7D6;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;margin:0;">— ORDER SUMMARY —</p>
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
      <tbody>${itemsRowsCustomer(order.items)}</tbody>
    </table>
    <div style="padding:16px 14px;border-top:1px solid #57C7D6;display:flex;justify-content:space-between;">
      <span style="font-family:'Courier New',monospace;color:#D9D9DC;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:0.1em;">Total Due</span>
      <span style="font-family:'Courier New',monospace;color:#57C7D6;font-size:22px;font-weight:bold;">${order.subtotal}</span>
    </div>
  </div>

  <!-- Zelle Payment -->
  <div style="background:#141518;border:2px solid #57C7D6;margin:0 0 24px;padding:28px;">
    <p style="font-family:'Courier New',monospace;color:#57C7D6;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 20px;">— PAYMENT INSTRUCTIONS —</p>

    <p style="color:#D9D9DC;font-size:15px;line-height:1.7;margin:0 0 20px;">
      Please send exactly <strong style="color:#57C7D6;font-size:18px;">${order.subtotal}</strong> via Zelle to:
    </p>

    <div style="background:#0A0B0D;border:1px solid #2A2D33;padding:20px;margin:0 0 20px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:0 0 14px;">
            <p style="font-family:'Courier New',monospace;color:#D9D9DC;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 6px;">Zelle Account Name</p>
            <p style="color:#F4F4F2;font-size:20px;font-weight:700;margin:0;letter-spacing:0.03em;">AWAKEN BIOLABS LLC</p>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 0 0;border-top:1px solid #2A2D33;">
            <p style="font-family:'Courier New',monospace;color:#D9D9DC;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 6px;">Zelle ID</p>
            <p style="color:#57C7D6;font-size:20px;font-weight:700;margin:0;">awakenbiolabs</p>
          </td>
        </tr>
      </table>
    </div>

    <!-- QR Code -->
    <div style="text-align:center;margin:0 0 20px;">
      <img src="${siteUrl}/zelle-qr.png" alt="Zelle QR Code — AWAKEN BIOLABS LLC" width="180" style="max-width:180px;display:block;margin:0 auto;" />
      <p style="font-family:'Courier New',monospace;color:#D9D9DC;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;margin:10px 0 0;">Scan to pay via Zelle</p>
    </div>

    <div style="border-top:1px solid #2A2D33;padding-top:18px;">
      <p style="color:#D9D9DC;font-size:14px;line-height:1.7;margin:0;">
        ⚠️&nbsp;<strong style="color:#F4F4F2;">After paying:</strong> reply to this email with a <strong style="color:#F4F4F2;">screenshot of your Zelle confirmation</strong>. Please send the <em>exact</em> amount — partial payments cannot be processed. Your order ships once payment is verified.
      </p>
    </div>
  </div>

  <!-- Ship To -->
  <div style="background:#141518;border:1px solid #2A2D33;margin:0 0 24px;padding:20px;">
    <p style="font-family:'Courier New',monospace;color:#57C7D6;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 14px;">— SHIP TO —</p>
    <p style="color:#F4F4F2;font-size:14px;line-height:1.9;margin:0;">
      ${order.customer.name}<br />
      ${order.shipping.line1}<br />
      ${order.shipping.city}, ${order.shipping.state} ${order.shipping.zip}
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
      Awaken Biolabs LLC · Las Vegas, NV
    </p>
  </div>

</div>
</body>
</html>`;

  return sendEmail({
    to: order.customer.email,
    subject: `Your Awaken Bio Labs Order — Payment Instructions`,
    html,
    replyTo: "support@awakenbiolabs.com",
  });
}

// ---------------------------------------------------------------------------
// Admin notification email
// ---------------------------------------------------------------------------

export async function sendAdminOrderEmail(order: Order) {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f9f9f9;">
<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:32px 20px;background:#ffffff;border:1px solid #e0e0e0;">

  <h2 style="color:#0A0B0D;border-bottom:3px solid #57C7D6;padding-bottom:12px;margin:0 0 24px;">
    🆕 New Order — Pending Payment
  </h2>

  <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
    <tr>
      <td style="padding:8px 0;color:#666;font-size:13px;width:140px;">Order ID</td>
      <td style="padding:8px 0;font-weight:bold;font-family:'Courier New',monospace;font-size:13px;">#${order.id.toUpperCase()}</td>
    </tr>
    <tr>
      <td style="padding:8px 0;color:#666;font-size:13px;">Placed</td>
      <td style="padding:8px 0;font-size:13px;">${new Date(order.createdAt).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}</td>
    </tr>
    <tr>
      <td style="padding:8px 0;color:#666;font-size:13px;">Status</td>
      <td style="padding:8px 0;"><span style="background:#fff3cd;color:#856404;padding:3px 10px;font-size:12px;font-family:'Courier New',monospace;border:1px solid #ffc107;">PENDING PAYMENT</span></td>
    </tr>
    <tr>
      <td style="padding:8px 0;color:#666;font-size:13px;">Total</td>
      <td style="padding:8px 0;color:#0070d2;font-size:20px;font-weight:bold;">${order.subtotal}</td>
    </tr>
  </table>

  <h3 style="color:#0A0B0D;margin:0 0 12px;font-size:15px;text-transform:uppercase;letter-spacing:0.05em;">Customer</h3>
  <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
    <tr>
      <td style="padding:6px 0;color:#666;font-size:13px;width:140px;">Name</td>
      <td style="padding:6px 0;font-size:13px;font-weight:600;">${order.customer.name}</td>
    </tr>
    <tr>
      <td style="padding:6px 0;color:#666;font-size:13px;">Email</td>
      <td style="padding:6px 0;font-size:13px;"><a href="mailto:${order.customer.email}" style="color:#0070d2;">${order.customer.email}</a></td>
    </tr>
    ${order.customer.phone ? `<tr><td style="padding:6px 0;color:#666;font-size:13px;">Phone</td><td style="padding:6px 0;font-size:13px;">${order.customer.phone}</td></tr>` : ""}
  </table>

  <h3 style="color:#0A0B0D;margin:0 0 12px;font-size:15px;text-transform:uppercase;letter-spacing:0.05em;">Ship To</h3>
  <p style="margin:0 0 24px;font-size:14px;line-height:1.8;color:#333;padding:14px;background:#f5f5f5;border-left:4px solid #57C7D6;">
    ${order.customer.name}<br />
    ${order.shipping.line1}<br />
    ${order.shipping.city}, ${order.shipping.state} ${order.shipping.zip}
  </p>

  <h3 style="color:#0A0B0D;margin:0 0 12px;font-size:15px;text-transform:uppercase;letter-spacing:0.05em;">Items Ordered</h3>
  <table style="width:100%;border-collapse:collapse;border:1px solid #ddd;margin:0 0 24px;">
    <thead>
      <tr style="background:#f0f0f0;">
        <th style="padding:10px 12px;text-align:left;border:1px solid #ddd;font-size:12px;color:#555;">Product</th>
        <th style="padding:10px 12px;text-align:center;border:1px solid #ddd;font-size:12px;color:#555;">Strength</th>
        <th style="padding:10px 12px;text-align:center;border:1px solid #ddd;font-size:12px;color:#555;">Qty</th>
        <th style="padding:10px 12px;text-align:right;border:1px solid #ddd;font-size:12px;color:#555;">Unit Price</th>
      </tr>
    </thead>
    <tbody>${itemsRowsAdmin(order.items)}</tbody>
    <tfoot>
      <tr style="background:#f0f0f0;font-weight:bold;">
        <td colspan="3" style="padding:12px;border:1px solid #ddd;font-size:14px;">TOTAL</td>
        <td style="padding:12px;border:1px solid #ddd;text-align:right;font-size:18px;color:#0070d2;">${order.subtotal}</td>
      </tr>
    </tfoot>
  </table>

  ${order.notes ? `<h3 style="color:#0A0B0D;margin:0 0 8px;font-size:15px;">Customer Notes</h3><p style="margin:0 0 24px;padding:14px;background:#f5f5f5;font-size:14px;line-height:1.6;color:#333;">${order.notes}</p>` : ""}

  <div style="padding:16px;background:#fff3cd;border:1px solid #ffc107;border-radius:4px;">
    <p style="margin:0 0 8px;font-weight:bold;font-size:14px;">⏳ Awaiting Zelle Payment Screenshot</p>
    <p style="margin:0;font-size:13px;color:#555;line-height:1.6;">
      The customer has been sent payment instructions. Once they reply with a Zelle confirmation screenshot, mark the order as <em>paid</em> and fulfill it. Update status at <a href="https://awakenbiolabs.com/admin/orders">awakenbiolabs.com/admin/orders</a>.
    </p>
  </div>

</div>
</body>
</html>`;

  return sendEmail({
    to: "admin@awakenbiolabs.com",
    subject: `New Order — Pending Payment | #${order.id.toUpperCase()} | ${order.subtotal}`,
    html,
  });
}
