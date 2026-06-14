import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { listAffiliates } from "@/lib/affiliate-db";
import { listOrders } from "@/lib/db";

export const dynamic = "force-dynamic";

function parseAmount(s: string): number {
  const n = parseFloat(s.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function checkAuth(): boolean {
  const token = cookies().get("awaken_admin")?.value;
  return !!(process.env.ADMIN_SESSION_TOKEN && token === process.env.ADMIN_SESSION_TOKEN);
}

export async function GET() {
  if (!checkAuth()) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const [affiliates, orders] = await Promise.all([listAffiliates(), listOrders()]);

  // Only active affiliates have real payouts
  const active = affiliates.filter((a) => a.status === "active" || a.status === "pending_contract" || a.status === "suspended");

  // Build a map: normalized code → affiliate
  const codeMap = new Map(active.map((a) => [a.affiliateCode.toUpperCase(), a]));

  // Group orders by affiliate code
  const ordersByCode = new Map<string, typeof orders>();
  for (const order of orders) {
    if (order.status === "cancelled") continue;
    const code = (order.discountCode ?? order.refCode ?? "").toUpperCase();
    if (!code || !codeMap.has(code)) continue;
    const list = ordersByCode.get(code) ?? [];
    list.push(order);
    ordersByCode.set(code, list);
  }

  const summaries = active.map((aff) => {
    const affOrders = ordersByCode.get(aff.affiliateCode.toUpperCase()) ?? [];
    const rate = aff.commissionRate;

    let confirmedEarnings = 0;
    let pendingEarnings = 0;

    const orderDetails = affOrders.map((o) => {
      const subtotal = parseAmount(o.subtotal);
      const commission = subtotal * rate;
      if (o.status === "fulfilled") confirmedEarnings += commission;
      else pendingEarnings += commission;

      return {
        id: o.id,
        createdAt: o.createdAt,
        status: o.status,
        subtotal: o.subtotal,
        commission: `$${commission.toFixed(2)}`,
        items: o.items,
      };
    });

    // Sort orders newest first
    orderDetails.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      id: aff.id,
      name: aff.name,
      email: aff.email,
      affiliateCode: aff.affiliateCode,
      programType: aff.programType,
      commissionRate: rate,
      status: aff.status,
      confirmedEarnings: parseFloat(confirmedEarnings.toFixed(2)),
      pendingEarnings: parseFloat(pendingEarnings.toFixed(2)),
      orderCount: affOrders.length,
      orders: orderDetails,
    };
  });

  const totalConfirmed = summaries.reduce((s, a) => s + a.confirmedEarnings, 0);
  const totalPending = summaries.reduce((s, a) => s + a.pendingEarnings, 0);
  const ambassadorCount = summaries.filter((a) => a.programType === "ambassador").length;
  const licenseeCount = summaries.filter((a) => a.programType === "licensee").length;

  return NextResponse.json({
    ok: true,
    totalConfirmed: parseFloat(totalConfirmed.toFixed(2)),
    totalPending: parseFloat(totalPending.toFixed(2)),
    ambassadorCount,
    licenseeCount,
    affiliates: summaries,
    fetchedAt: new Date().toISOString(),
  });
}
