import type { Order } from "./db";

// ---------------------------------------------------------------------------
// ShipStation REST API v1
// Docs: https://www.shipstation.com/docs/api/
//
// Required env vars (add in Vercel → Settings → Environment Variables):
//   SHIPSTATION_API_KEY     — from ShipStation → Account → API Settings
//   SHIPSTATION_API_SECRET  — same page
// ---------------------------------------------------------------------------

const BASE = "https://ssapi.shipstation.com";

function authHeader(): string {
  const key = process.env.SHIPSTATION_API_KEY ?? "";
  const secret = process.env.SHIPSTATION_API_SECRET ?? "";
  return "Basic " + Buffer.from(`${key}:${secret}`).toString("base64");
}

function parseAmount(price: string): number {
  const n = parseFloat(price.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

/** Push an order to ShipStation as "awaiting_shipment". */
export async function createShipStationOrder(order: Order): Promise<void> {
  if (!process.env.SHIPSTATION_API_KEY) {
    console.log("[shipstation] No API key — skipping order push for", order.id);
    return;
  }

  const payload = {
    orderNumber: order.id,
    orderKey: order.id,
    orderDate: order.createdAt,
    orderStatus: "awaiting_shipment",
    customerUsername: order.customer.email,
    customerEmail: order.customer.email,
    billTo: {
      name: order.customer.name,
      street1: order.shipping.line1,
      city: order.shipping.city,
      state: order.shipping.state,
      postalCode: order.shipping.zip,
      country: "US",
      phone: order.customer.phone ?? null,
    },
    shipTo: {
      name: order.customer.name,
      street1: order.shipping.line1,
      city: order.shipping.city,
      state: order.shipping.state,
      postalCode: order.shipping.zip,
      country: "US",
      phone: order.customer.phone ?? null,
    },
    items: order.items.map((item, i) => ({
      lineItemKey: String(i),
      name: `${item.product} · ${item.strength}`,
      quantity: item.qty,
      unitPrice: parseAmount(item.price),
      sku: `${item.product}-${item.strength}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-"),
    })),
    amountPaid: parseAmount(order.subtotal),
    paymentDate: new Date().toISOString(),
    paymentMethod: "Other",
    internalNotes: [
      "Payment: Zelle",
      order.notes ? `Customer note: ${order.notes}` : null,
    ]
      .filter(Boolean)
      .join(" | "),
    // Tag so you can filter in ShipStation
    tagIds: [],
  };

  const res = await fetch(`${BASE}/orders/createorder`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ShipStation ${res.status}: ${text}`);
  }

  console.log("[shipstation] Order pushed:", order.id);
}

/** Fetch shipment details from a ShipStation webhook resource_url. */
export async function fetchShipStationResource<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: authHeader() },
  });
  if (!res.ok) throw new Error(`ShipStation resource fetch failed: ${res.status}`);
  return res.json() as Promise<T>;
}
