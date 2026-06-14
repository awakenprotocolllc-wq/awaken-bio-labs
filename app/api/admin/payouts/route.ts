import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { listAffiliates, getPayoutRecordsForMonths, savePayoutRecord } from "@/lib/affiliate-db";
import { validateAdminSession } from "@/lib/admin-auth";
import { listOrders } from "@/lib/db";
import { apiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

function parseAmount(s: string): number {
  const n = parseFloat(s.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

async function checkAuth(): Promise<boolean> {
  const token = (await cookies()).get("awaken_admin")?.value;
  return validateAdminSession(token);
}

// GET — full payout summary for all affiliates, including payout records
export async function GET() {
  try {
  if (!(await checkAuth())) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const [affiliates, orders] = await Promise.all([listAffiliates(), listOrders()]);

  const active = affiliates.filter(
    (a) => a.status === "active" || a.status === "pending_contract" || a.status === "suspended"
  );

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

  // Build summaries + fetch payout records per affiliate
  const summaries = await Promise.all(
    active.map(async (aff) => {
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

      orderDetails.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Fetch payout records for every month that has orders
      const months = [...new Set(affOrders.map((o) => monthKey(o.createdAt)))];
      const payoutRecords = await getPayoutRecordsForMonths(aff.id, months);

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
        payoutRecords,
      };
    })
  );

  const totalConfirmed   = summaries.reduce((s, a) => s + a.confirmedEarnings, 0);
  const totalPending     = summaries.reduce((s, a) => s + a.pendingEarnings, 0);
  const totalPaid        = summaries.reduce((s, a) => s + Object.values(a.payoutRecords).reduce((r, p) => r + p.amount, 0), 0);
  const ambassadorCount  = summaries.filter((a) => a.programType === "ambassador").length;
  const licenseeCount    = summaries.filter((a) => a.programType === "licensee").length;

  return NextResponse.json({
    ok: true,
    totalConfirmed: parseFloat(totalConfirmed.toFixed(2)),
    totalPending:   parseFloat(totalPending.toFixed(2)),
    totalPaid:      parseFloat(totalPaid.toFixed(2)),
    ambassadorCount,
    licenseeCount,
    affiliates: summaries,
    fetchedAt: new Date().toISOString(),
  });
  } catch (err) {
    return apiError("GET /api/admin/payouts", err);
  }
}

// POST — record a payout for one affiliate for one month
export async function POST(req: NextRequest) {
  try {
  if (!(await checkAuth())) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { affiliateId, month, amount, confirmationCode, note } = await req.json();

  if (typeof affiliateId !== "string" || !affiliateId.trim() || affiliateId.length > 100) {
    return NextResponse.json({ ok: false, error: "affiliateId, month, and confirmationCode are required." }, { status: 400 });
  }
  if (typeof month !== "string" || !month.trim()) {
    return NextResponse.json({ ok: false, error: "affiliateId, month, and confirmationCode are required." }, { status: 400 });
  }
  if (typeof confirmationCode !== "string" || !confirmationCode.trim() || confirmationCode.length > 200) {
    return NextResponse.json({ ok: false, error: "affiliateId, month, and confirmationCode are required." }, { status: 400 });
  }
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
    return NextResponse.json({ ok: false, error: "amount must be a positive number." }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ ok: false, error: "month must be YYYY-MM format." }, { status: 400 });
  }
  if (note !== undefined && (typeof note !== "string" || note.length > 1000)) {
    return NextResponse.json({ ok: false, error: "note must be a string under 1000 characters." }, { status: 400 });
  }

  const record = await savePayoutRecord(affiliateId, month, {
    amount: parseFloat(amount.toFixed(2)),
    confirmationCode: confirmationCode.trim(),
    note: note?.trim() || undefined,
  });

  return NextResponse.json({ ok: true, record });
  } catch (err) {
    return apiError("POST /api/admin/payouts", err);
  }
}
