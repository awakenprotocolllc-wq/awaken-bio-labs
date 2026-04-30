// =============================================================================
// DEMO DATA — REPLACE WITH REAL QUERIES BEFORE PRODUCTION
// =============================================================================
// Returns realistic mock KPIs / payouts / referrals for the dashboard UI.
// Swap each function with database queries scoped to the affiliate_id.
// =============================================================================

export type Kpi = {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down" | "flat";
  hint: string;
};

export type Referral = {
  date: string;
  order: string;
  product: string;
  amount: number;
  commission: number;
  status: "Paid" | "Pending" | "Cleared";
};

export type Payout = {
  date: string;
  amount: number;
  method: string;
  status: "Paid" | "Processing";
  reference: string;
};

export type ChartPoint = { day: string; clicks: number; sales: number };

export function getKpis(): Kpi[] {
  return [
    {
      label: "Total Earnings",
      value: "$4,287.50",
      delta: "+18.2%",
      trend: "up",
      hint: "Last 30 days vs. prior 30",
    },
    {
      label: "Conversions",
      value: "47",
      delta: "+9",
      trend: "up",
      hint: "Orders attributed to your code",
    },
    {
      label: "Click-Through",
      value: "3,142",
      delta: "+412",
      trend: "up",
      hint: "Unique link clicks",
    },
    {
      label: "Conversion Rate",
      value: "1.50%",
      delta: "+0.2pt",
      trend: "up",
      hint: "Conversions ÷ clicks",
    },
  ];
}

export function getChart(): ChartPoint[] {
  return [
    { day: "Mon", clicks: 320, sales: 4 },
    { day: "Tue", clicks: 410, sales: 6 },
    { day: "Wed", clicks: 380, sales: 5 },
    { day: "Thu", clicks: 510, sales: 8 },
    { day: "Fri", clicks: 620, sales: 10 },
    { day: "Sat", clicks: 480, sales: 7 },
    { day: "Sun", clicks: 422, sales: 7 },
  ];
}

export function getReferrals(): Referral[] {
  return [
    { date: "2026-04-29", order: "AWK-10421", product: "BPC-157 · 10mg", amount: 89.0, commission: 22.25, status: "Cleared" },
    { date: "2026-04-28", order: "AWK-10418", product: "Tirzepatide · 30mg", amount: 249.0, commission: 62.25, status: "Cleared" },
    { date: "2026-04-27", order: "AWK-10410", product: "Wolverine Blend · 20mg", amount: 145.0, commission: 36.25, status: "Cleared" },
    { date: "2026-04-26", order: "AWK-10402", product: "Ipamorelin · 5mg", amount: 65.0, commission: 16.25, status: "Pending" },
    { date: "2026-04-25", order: "AWK-10399", product: "MOTS-C · 10mg", amount: 95.0, commission: 23.75, status: "Pending" },
    { date: "2026-04-24", order: "AWK-10391", product: "NAD+ · 1,000mg", amount: 185.0, commission: 46.25, status: "Cleared" },
    { date: "2026-04-23", order: "AWK-10384", product: "GHK-CU · 100mg", amount: 110.0, commission: 27.5, status: "Paid" },
    { date: "2026-04-21", order: "AWK-10371", product: "Retatrutide · 20mg", amount: 220.0, commission: 55.0, status: "Paid" },
    { date: "2026-04-20", order: "AWK-10366", product: "PT-141 · 10mg", amount: 85.0, commission: 21.25, status: "Paid" },
    { date: "2026-04-18", order: "AWK-10358", product: "Semaglutide · 10mg", amount: 175.0, commission: 43.75, status: "Paid" },
  ];
}

export function getPayouts(): Payout[] {
  return [
    { date: "2026-04-15", amount: 1248.5, method: "ACH · ****4421", status: "Paid", reference: "PAY-002214" },
    { date: "2026-04-01", amount: 982.25, method: "ACH · ****4421", status: "Paid", reference: "PAY-002187" },
    { date: "2026-03-15", amount: 1411.75, method: "ACH · ****4421", status: "Paid", reference: "PAY-002154" },
    { date: "2026-03-01", amount: 875.0, method: "ACH · ****4421", status: "Paid", reference: "PAY-002121" },
  ];
}
