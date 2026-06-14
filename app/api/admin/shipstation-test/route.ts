import { NextRequest, NextResponse } from "next/server";
import { listOrders } from "@/lib/db";
import { validateAdminSession } from "@/lib/admin-auth";
import { apiError } from "@/lib/api-error";

const BASE = "https://ssapi.shipstation.com";

function authHeader(): string {
  const key = process.env.SHIPSTATION_API_KEY ?? "";
  const secret = process.env.SHIPSTATION_API_SECRET ?? "";
  return "Basic " + Buffer.from(`${key}:${secret}`).toString("base64");
}

// GET /api/admin/shipstation-test
// Verifies ShipStation credentials and optionally pushes the most recent paid order.
// Protected by admin cookie.
export async function GET(req: NextRequest) {
  try {
  if (!(await validateAdminSession(req.cookies.get("awaken_admin")?.value))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.SHIPSTATION_API_KEY;
  const apiSecret = process.env.SHIPSTATION_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json({
      ok: false,
      error: "SHIPSTATION_API_KEY or SHIPSTATION_API_SECRET not set in Vercel env vars",
    });
  }

  // 1. Test credentials by hitting /orders endpoint
  const credTest = await fetch(`${BASE}/orders?pageSize=1`, {
    headers: { Authorization: authHeader() },
  });
  const credBody = await credTest.text();

  if (!credTest.ok) {
    return NextResponse.json({
      ok: false,
      step: "credential_check",
      httpStatus: credTest.status,
      response: credBody,
    });
  }

  // 2. Find the most recent paid order and attempt to push it
  const orders = await listOrders();
  const paidOrder = orders.find((o) => o.status === "paid");

  if (!paidOrder) {
    return NextResponse.json({
      ok: true,
      credentialsValid: true,
      message: "ShipStation credentials are valid but no paid orders found to test push.",
    });
  }

  const parseAmount = (price: string) => parseFloat(price.replace(/[^0-9.]/g, "")) || 0;

  const payload = {
    orderNumber: paidOrder.id,
    orderKey: paidOrder.id,
    orderDate: paidOrder.createdAt,
    orderStatus: "awaiting_shipment",
    customerUsername: paidOrder.customer.email,
    customerEmail: paidOrder.customer.email,
    billTo: {
      name: paidOrder.customer.name,
      street1: paidOrder.shipping.line1,
      city: paidOrder.shipping.city,
      state: paidOrder.shipping.state,
      postalCode: paidOrder.shipping.zip,
      country: "US",
      phone: null,
    },
    shipTo: {
      name: paidOrder.customer.name,
      street1: paidOrder.shipping.line1,
      city: paidOrder.shipping.city,
      state: paidOrder.shipping.state,
      postalCode: paidOrder.shipping.zip,
      country: "US",
      phone: null,
    },
    items: paidOrder.items.map((item, i) => ({
      lineItemKey: String(i),
      name: `${item.product} · ${item.strength}`,
      quantity: item.qty,
      unitPrice: parseAmount(item.price),
      sku: `${item.product}-${item.strength}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    })),
    amountPaid: parseAmount(paidOrder.orderTotal ?? paidOrder.subtotal),
    paymentDate: new Date().toISOString(),
    paymentMethod: "Other",
    internalNotes: [
      paidOrder.paymentMethod === "zelle" ? "Payment: Zelle" : "Payment: Card — Quiklie",
      paidOrder.notes ? `Customer note: ${paidOrder.notes}` : null,
    ].filter(Boolean).join(" | "),
  };

  const pushRes = await fetch(`${BASE}/orders/createorder`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const pushBody = await pushRes.text();

  return NextResponse.json({
    ok: pushRes.ok,
    credentialsValid: true,
    testedOrderId: paidOrder.id,
    shipStationHttpStatus: pushRes.status,
    shipStationResponse: pushBody,
    payloadSent: payload,
  });
  } catch (err) {
    return apiError("GET /api/admin/shipstation-test", err);
  }
}
