import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/db";
import { apiError } from "@/lib/api-error";
import { fetchShipStationResource } from "@/lib/shipstation";

// ---------------------------------------------------------------------------
// POST /api/webhooks/shipstation
//
// ShipStation fires a SHIP_NOTIFY webhook when a shipment label is created
// (i.e. the order has shipped). We use this to auto-mark orders as
// "fulfilled", which also confirms the affiliate commission.
//
// Setup in ShipStation:
//   Account Settings → Webhooks → Add Webhook
//   Event: "Item Shipped"
//   URL:   https://awakenbiolabs.com/api/webhooks/shipstation
//   (optionally add a secret below for verification)
// ---------------------------------------------------------------------------

type ShipStationWebhookBody = {
  resource_url: string;
  resource_type: string;
};

type ShipStationShipment = {
  orderNumber: string; // this is our order ID
  shipmentId: number;
  trackingNumber?: string;
  carrierCode?: string;
};

type ShipStationShipmentsResponse = {
  shipments: ShipStationShipment[];
};

const SHIPSTATION_API_BASE = "https://ssapi.shipstation.com/";

export async function POST(req: NextRequest) {
  try {
    // Verify webhook secret — SHIPSTATION_WEBHOOK_SECRET must be set in Vercel env vars
    const webhookSecret = process.env.SHIPSTATION_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[shipstation/webhook] SHIPSTATION_WEBHOOK_SECRET is not configured");
      return NextResponse.json({ ok: false, error: "Webhook not configured" }, { status: 500 });
    }
    const providedSecret = req.nextUrl.searchParams.get("secret");
    if (!providedSecret || providedSecret !== webhookSecret) {
      console.warn("[shipstation/webhook] Rejected: invalid or missing secret");
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as ShipStationWebhookBody;
    const { resource_url, resource_type } = body;

    // Only handle ship notifications
    if (resource_type !== "SHIP_NOTIFY") {
      return NextResponse.json({ ok: true, skipped: true });
    }

    if (!resource_url || typeof resource_url !== "string") {
      return NextResponse.json({ ok: false, error: "Missing resource_url" }, { status: 400 });
    }

    // SSRF protection: only allow requests to ShipStation's API domain
    if (!resource_url.startsWith(SHIPSTATION_API_BASE)) {
      console.warn("[shipstation/webhook] Rejected suspicious resource_url:", resource_url);
      return NextResponse.json({ ok: false, error: "Invalid resource_url" }, { status: 400 });
    }

    // Fetch the actual shipment data from ShipStation
    const data = await fetchShipStationResource<ShipStationShipmentsResponse>(resource_url);
    const shipments = data.shipments ?? [];

    const results = await Promise.allSettled(
      shipments.map(async (shipment) => {
        const orderId = shipment.orderNumber;
        if (!orderId) return;

        const updated = await updateOrderStatus(orderId, "fulfilled");
        if (updated) {
          console.log(
            `[shipstation/webhook] Order ${orderId} fulfilled.`,
            shipment.trackingNumber ? `Tracking: ${shipment.trackingNumber}` : ""
          );
        } else {
          console.warn(`[shipstation/webhook] Order not found: ${orderId}`);
        }
      })
    );

    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length) {
      console.error("[shipstation/webhook] Some updates failed:", failed);
    }

    return NextResponse.json({ ok: true, processed: shipments.length });
  } catch (err) {
    console.error("[shipstation/webhook] Error:", err);
    // Return 200 so ShipStation doesn't keep retrying on our parse errors
    return NextResponse.json({ ok: false, error: "Server error" });
  }
}
