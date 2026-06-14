import { sendEmail, escape } from "./email";
import { type Order } from "./db";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function itemsRowsCustomer(items: Order["items"]): string {
  return items
    .map(
      (item) => `
    <tr>
      <td style="padding:12px 14px;border-bottom:1px solid #2A2D33;color:#F4F4F2;font-family:'Courier New',monospace;font-size:13px;">${escape(item.product)}</td>
      <td style="padding:12px 14px;border-bottom:1px solid #2A2D33;color:#57C7D6;font-family:'Courier New',monospace;font-size:13px;text-align:center;">${escape(item.strength)}</td>
      <td style="padding:12px 14px;border-bottom:1px solid #2A2D33;color:#F4F4F2;font-family:'Courier New',monospace;font-size:13px;text-align:center;">${item.qty}</td>
      <td style="padding:12px 14px;border-bottom:1px solid #2A2D33;color:#57C7D6;font-family:'Courier New',monospace;font-size:13px;text-align:right;font-weight:bold;">${escape(item.price)}</td>
    </tr>`
    )
    .join("");
}

function itemsRowsAdmin(items: Order["items"]): string {
  return items
    .map(
      (item) => `
    <tr>
      <td style="padding:8px 12px;border:1px solid #ddd;">${escape(item.product)}</td>
      <td style="padding:8px 12px;border:1px solid #ddd;text-align:center;">${escape(item.strength)}</td>
      <td style="padding:8px 12px;border:1px solid #ddd;text-align:center;">${item.qty}</td>
      <td style="padding:8px 12px;border:1px solid #ddd;text-align:right;font-weight:bold;">${escape(item.price)}</td>
    </tr>`
    )
    .join("");
}

// ---------------------------------------------------------------------------
// Customer email — order confirmed (sent after Quiklie payment webhook)
// ---------------------------------------------------------------------------

export async function sendCustomerOrderEmail(order: Order) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://awakenbiolabs.com";
  const displayTotal = order.orderTotal ?? order.subtotal;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#0A0B0D;">
<div style="background:#0A0B0D;color:#F4F4F2;font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 24px;">

  <!-- Header -->
  <div style="border-bottom:1px solid #2A2D33;padding-bottom:24px;margin-bottom:32px;">
    <p style="font-family:'Courier New',monospace;color:#57C7D6;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 12px;">AWAKEN BIO LABS</p>
    <h1 style="color:#F4F4F2;font-size:26px;margin:0 0 8px;font-weight:700;">Order Confirmed</h1>
    <p style="font-family:'Courier New',monospace;color:#D9D9DC;font-size:12px;margin:0;">
      Order <strong style="color:#57C7D6;">#${escape(order.id.toUpperCase())}</strong>
      &nbsp;·&nbsp;
      ${new Date(order.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
    </p>
  </div>

  <!-- Confirmation message -->
  <p style="color:#D9D9DC;font-size:15px;line-height:1.7;margin:0 0 28px;">
    Hi <strong style="color:#F4F4F2;">${escape(order.customer.name)}</strong>,<br /><br />
    Your payment has been received and your order is confirmed. We&apos;re preparing your package and will ship it within 1 business day. You&apos;ll receive a shipping notification once it&apos;s on its way.
  </p>

  <!-- Payment status badge -->
  ${order.paymentMethod === "zelle" ? `
  <div style="background:#1a2a3a;border:1px solid #1a4a7a;padding:16px 20px;margin:0 0 28px;">
    <p style="font-family:'Courier New',monospace;color:#57C7D6;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 10px;">
      📲 &nbsp;Action Required — Send Zelle Payment
    </p>
    <p style="font-family:'Courier New',monospace;color:#D9D9DC;font-size:12px;margin:0 0 6px;">
      Amount: <strong style="color:#57C7D6;">${escape(displayTotal)}</strong>
    </p>
    <p style="font-family:'Courier New',monospace;color:#D9D9DC;font-size:12px;margin:0 0 6px;">
      Zelle ID: <strong style="color:#F4F4F2;">awakenbiolabs</strong>
    </p>
    <p style="font-family:'Courier New',monospace;color:#D9D9DC;font-size:12px;margin:0 0 6px;">
      Name: <strong style="color:#F4F4F2;">AWAKEN BIOLABS LLC</strong>
    </p>
    <p style="font-family:'Courier New',monospace;color:#D9D9DC;font-size:11px;margin:12px 0 0;opacity:0.7;">
      Reply to this email with a screenshot of your Zelle confirmation. Your order ships once payment is verified.
    </p>
  </div>` : `
  <div style="background:#0d2e1a;border:1px solid #1a5c35;padding:16px 20px;margin:0 0 28px;">
    <p style="font-family:'Courier New',monospace;color:#2ecc71;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;margin:0;">
      ✓ &nbsp;Payment confirmed &nbsp;·&nbsp; ${escape(displayTotal)}
    </p>
  </div>`}

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
    <!-- Totals -->
    <div style="padding:12px 14px;border-top:1px solid #2A2D33;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:4px 0;font-family:'Courier New',monospace;color:#D9D9DC;font-size:12px;">Subtotal</td>
          <td style="padding:4px 0;font-family:'Courier New',monospace;color:#D9D9DC;font-size:12px;text-align:right;">${escape(order.subtotal)}</td>
        </tr>
        ${order.discountAmount ? `
        <tr>
          <td style="padding:4px 0;font-family:'Courier New',monospace;color:#2ecc71;font-size:12px;">Discount${order.discountCode ? ` (${escape(order.discountCode)})` : ""}</td>
          <td style="padding:4px 0;font-family:'Courier New',monospace;color:#2ecc71;font-size:12px;text-align:right;">−${escape(order.discountAmount)}</td>
        </tr>` : ""}
        ${order.shippingCost ? `
        <tr>
          <td style="padding:4px 0;font-family:'Courier New',monospace;color:#D9D9DC;font-size:12px;">Shipping — UPS 2-Day</td>
          <td style="padding:4px 0;font-family:'Courier New',monospace;color:#D9D9DC;font-size:12px;text-align:right;">${escape(order.shippingCost)}</td>
        </tr>` : ""}
        ${order.processingFee ? `
        <tr>
          <td style="padding:4px 0;font-family:'Courier New',monospace;color:#D9D9DC;font-size:12px;">Card Processing (4%)</td>
          <td style="padding:4px 0;font-family:'Courier New',monospace;color:#D9D9DC;font-size:12px;text-align:right;">${escape(order.processingFee)}</td>
        </tr>` : ""}
        <tr>
          <td style="padding:10px 0 4px;border-top:1px solid #57C7D6;font-family:'Courier New',monospace;color:#D9D9DC;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:0.1em;">${order.paymentMethod === "zelle" ? "Order Total (Due via Zelle)" : "Total Charged"}</td>
          <td style="padding:10px 0 4px;border-top:1px solid #57C7D6;font-family:'Courier New',monospace;color:#57C7D6;font-size:20px;font-weight:bold;text-align:right;">${escape(displayTotal)}</td>
        </tr>
      </table>
    </div>
  </div>

  <!-- Ship To -->
  <div style="background:#141518;border:1px solid #2A2D33;margin:0 0 24px;padding:20px;">
    <p style="font-family:'Courier New',monospace;color:#57C7D6;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 14px;">— SHIP TO —</p>
    <p style="color:#F4F4F2;font-size:14px;line-height:1.9;margin:0;">
      ${escape(order.customer.name)}<br />
      ${escape(order.shipping.line1)}<br />
      ${escape(order.shipping.city)}, ${escape(order.shipping.state)} ${escape(order.shipping.zip)}
    </p>
  </div>

  ${order.notes ? `
  <div style="background:#141518;border:1px solid #2A2D33;margin:0 0 24px;padding:20px;">
    <p style="font-family:'Courier New',monospace;color:#57C7D6;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 10px;">— ORDER NOTES —</p>
    <p style="color:#D9D9DC;font-size:14px;line-height:1.6;margin:0;">${escape(order.notes)}</p>
  </div>` : ""}

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
    subject: `Order Confirmed — #${order.id.toUpperCase()} | Awaken Bio Labs`,
    html,
    replyTo: "support@awakenbiolabs.com",
  });
}

// ---------------------------------------------------------------------------
// Admin notification email — new paid order ready to fulfill
// ---------------------------------------------------------------------------

export async function sendAdminOrderEmail(order: Order) {
  const displayTotal = order.orderTotal ?? order.subtotal;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f9f9f9;">
<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:32px 20px;background:#ffffff;border:1px solid #e0e0e0;">

  <h2 style="color:#0A0B0D;border-bottom:3px solid #57C7D6;padding-bottom:12px;margin:0 0 24px;">
    💳 New Paid Order — Ready to Fulfill
  </h2>

  <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
    <tr>
      <td style="padding:8px 0;color:#666;font-size:13px;width:140px;">Order ID</td>
      <td style="padding:8px 0;font-weight:bold;font-family:'Courier New',monospace;font-size:13px;">#${escape(order.id.toUpperCase())}</td>
    </tr>
    <tr>
      <td style="padding:8px 0;color:#666;font-size:13px;">Placed</td>
      <td style="padding:8px 0;font-size:13px;">${new Date(order.createdAt).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}</td>
    </tr>
    <tr>
      <td style="padding:8px 0;color:#666;font-size:13px;">Status</td>
      <td style="padding:8px 0;">${order.paymentMethod === "zelle"
    ? `<span style="background:#fff3cd;color:#856404;padding:3px 10px;font-size:12px;font-family:'Courier New',monospace;border:1px solid #ffc107;">AWAITING ZELLE</span>`
    : `<span style="background:#d4edda;color:#155724;padding:3px 10px;font-size:12px;font-family:'Courier New',monospace;border:1px solid #c3e6cb;">PAID — QUIKLIE</span>`
  }</td>
    </tr>
    <tr>
      <td style="padding:8px 0;color:#666;font-size:13px;">Total</td>
      <td style="padding:8px 0;color:#0070d2;font-size:20px;font-weight:bold;">${escape(displayTotal)}</td>
    </tr>
    ${order.discountCode ? `
    <tr>
      <td style="padding:8px 0;color:#666;font-size:13px;">Discount Code</td>
      <td style="padding:8px 0;font-family:'Courier New',monospace;font-size:13px;color:#2e7d32;">${escape(order.discountCode)}${order.discountAmount ? ` (−${escape(order.discountAmount)})` : ""}</td>
    </tr>` : ""}
    ${order.refCode && order.refCode !== order.discountCode ? `
    <tr>
      <td style="padding:8px 0;color:#666;font-size:13px;">Ref Code</td>
      <td style="padding:8px 0;font-family:'Courier New',monospace;font-size:13px;">${escape(order.refCode)}</td>
    </tr>` : ""}
  </table>

  <h3 style="color:#0A0B0D;margin:0 0 12px;font-size:15px;text-transform:uppercase;letter-spacing:0.05em;">Customer</h3>
  <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
    <tr>
      <td style="padding:6px 0;color:#666;font-size:13px;width:140px;">Name</td>
      <td style="padding:6px 0;font-size:13px;font-weight:600;">${escape(order.customer.name)}</td>
    </tr>
    <tr>
      <td style="padding:6px 0;color:#666;font-size:13px;">Email</td>
      <td style="padding:6px 0;font-size:13px;"><a href="mailto:${escape(order.customer.email)}" style="color:#0070d2;">${escape(order.customer.email)}</a></td>
    </tr>

  </table>

  <h3 style="color:#0A0B0D;margin:0 0 12px;font-size:15px;text-transform:uppercase;letter-spacing:0.05em;">Ship To</h3>
  <p style="margin:0 0 24px;font-size:14px;line-height:1.8;color:#333;padding:14px;background:#f5f5f5;border-left:4px solid #57C7D6;">
    ${escape(order.customer.name)}<br />
    ${escape(order.shipping.line1)}<br />
    ${escape(order.shipping.city)}, ${escape(order.shipping.state)} ${escape(order.shipping.zip)}
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
        <td colspan="3" style="padding:12px;border:1px solid #ddd;font-size:14px;">TOTAL CHARGED</td>
        <td style="padding:12px;border:1px solid #ddd;text-align:right;font-size:18px;color:#0070d2;">${escape(displayTotal)}</td>
      </tr>
    </tfoot>
  </table>

  ${order.notes ? `<h3 style="color:#0A0B0D;margin:0 0 8px;font-size:15px;">Customer Notes</h3><p style="margin:0 0 24px;padding:14px;background:#f5f5f5;font-size:14px;line-height:1.6;color:#333;">${escape(order.notes)}</p>` : ""}

  ${order.paymentMethod === "zelle" ? `
  <div style="padding:16px;background:#fff3cd;border:1px solid #ffc107;border-radius:4px;">
    <p style="margin:0 0 8px;font-weight:bold;font-size:14px;color:#856404;">📲 Awaiting Zelle payment — do not ship yet</p>
    <p style="margin:0;font-size:13px;color:#856404;line-height:1.6;">
      Customer has been sent Zelle instructions. Once they send a screenshot confirmation, mark as paid and ship.
      Manage at <a href="https://awakenbiolabs.com/admin/orders" style="color:#0070d2;">awakenbiolabs.com/admin/orders</a>.
    </p>
  </div>` : `
  <div style="padding:16px;background:#d4edda;border:1px solid #c3e6cb;border-radius:4px;">
    <p style="margin:0 0 8px;font-weight:bold;font-size:14px;color:#155724;">✓ Payment confirmed via Quiklie — order is ready to fulfill</p>
    <p style="margin:0;font-size:13px;color:#155724;line-height:1.6;">
      This order has been paid. Push it to ShipStation and ship. Manage at
      <a href="https://awakenbiolabs.com/admin/orders" style="color:#0070d2;">awakenbiolabs.com/admin/orders</a>.
    </p>
  </div>`}

</div>
</body>
</html>`;

  const subject = order.paymentMethod === "zelle"
    ? `New Order — Awaiting Zelle — #${order.id.toUpperCase()} | ${displayTotal}`
    : `New Paid Order — #${order.id.toUpperCase()} | ${displayTotal}`;

  return sendEmail({
    to: "admin@awakenbiolabs.com",
    subject,
    html,
  });
}
