import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOrder } from "@/lib/db";

const BASE = "https://ssapi.shipstation.com";

function authHeader(): string {
  const key = process.env.SHIPSTATION_API_KEY ?? "";
  const secret = process.env.SHIPSTATION_API_SECRET ?? "";
  return "Basic " + Buffer.from(`${key}:${secret}`).toString("base64");
}

function envStatus(key: string) {
  const val = process.env[key];
  if (!val) return { status: "missing" as const, chars: 0 };
  return { status: "set" as const, chars: val.length };
}

function parseAmount(price: string): number {
  const n = parseFloat(price.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function checkAuth(): boolean {
  const token = cookies().get("awaken_admin")?.value;
  const expected = process.env.ADMIN_SESSION_TOKEN;
  return !!(expected && token === expected);
}

// GET — env var status + ShipStation connection test
export async function GET(req: NextRequest) {
  if (!checkAuth()) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const envVars = {
    QUIKLIE_API_KEY: envStatus("QUIKLIE_API_KEY"),
    QUIKLIE_MERCHANT_ID: envStatus("QUIKLIE_MERCHANT_ID"),
    SHIPSTATION_API_KEY: envStatus("SHIPSTATION_API_KEY"),
    SHIPSTATION_API_SECRET: envStatus("SHIPSTATION_API_SECRET"),
    RESEND_API_KEY: envStatus("RESEND_API_KEY"),
    ADMIN_SESSION_TOKEN: envStatus("ADMIN_SESSION_TOKEN"),
    KV_REST_API_URL: envStatus("KV_REST_API_URL"),
    KV_REST_API_TOKEN: envStatus("KV_REST_API_TOKEN"),
  };

  // Test ShipStation credentials
  let shipstation: { ok: boolean; status?: number; error?: string } = { ok: false };
  try {
    const res = await fetch(`${BASE}/orders?pageSize=1`, {
      headers: { Authorization: authHeader() },
    });
    if (res.ok) {
      shipstation = { ok: true };
    } else {
      const text = await res.text();
      shipstation = { ok: false, status: res.status, error: text.slice(0, 200) };
    }
  } catch (e) {
    shipstation = { ok: false, error: String(e) };
  }

  return NextResponse.json({ ok: true, envVars, shipstation });
}

// POST — push a specific order to ShipStation
export async function POST(req: NextRequest) {
  if (!checkAuth()) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { orderId } = await req.json();
  if (!orderId) return NextResponse.json({ ok: false, error: "orderId required" }, { status: 400 });

  const order = await getOrder(orderId);
  if (!order) return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });

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
      sku: `${item.product}-${item.strength}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    })),
    amountPaid: parseAmount(order.orderTotal ?? order.subtotal),
    paymentDate: new Date().toISOString(),
    paymentMethod: "Other",
    internalNotes: [
      order.paymentMethod === "zelle" ? "Payment: Zelle" : "Payment: Card — Quiklie",
      order.processingFee ? `Processing fee: ${order.processingFee}` : null,
      order.notes ? `Customer note: ${order.notes}` : null,
    ].filter(Boolean).join(" | "),
  };

  const res = await fetch(`${BASE}/orders/createorder`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await res.text();
  let parsed: unknown;
  try { parsed = JSON.parse(body); } catch { parsed = body; }

  return NextResponse.json({
    ok: res.ok,
    httpStatus: res.status,
    shipStationResponse: parsed,
  });
}
