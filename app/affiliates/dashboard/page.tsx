"use client";

import AffiliateDashboardShell from "@/components/AffiliateDashboardShell";
import { getKpis, getChart, getReferrals } from "@/lib/affiliate-data";

export default function DashboardOverview() {
  const kpis = getKpis();
  const chart = getChart();
  const recent = getReferrals().slice(0, 6);
  const max = Math.max(...chart.map((c) => c.clicks));

  return (
    <AffiliateDashboardShell title="Overview.">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate mb-10">
        {kpis.map((k) => (
          <div key={k.label} className="bg-carbon p-5 sm:p-6">
            <p className="font-mono text-[10px] text-bone tracking-[0.2em] uppercase mb-3">
              {k.label}
            </p>
            <p className="font-sans font-bold text-paper text-2xl sm:text-3xl tracking-tight">
              {k.value}
            </p>
            <p
              className={`font-mono text-xs mt-2 ${
                k.trend === "up"
                  ? "text-accent"
                  : k.trend === "down"
                  ? "text-red-400"
                  : "text-bone"
              }`}
            >
              {k.trend === "up" ? "▲" : k.trend === "down" ? "▼" : "→"} {k.delta}
            </p>
            <p className="font-mono text-[10px] text-bone mt-2 tracking-wide">
              {k.hint}
            </p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-carbon border border-slate p-6 sm:p-8 mb-10">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <p className="font-mono text-[10px] text-accent tracking-[0.2em] uppercase mb-2">
              — TRAFFIC THIS WEEK —
            </p>
            <h2 className="font-sans font-bold text-paper text-xl sm:text-2xl">
              Clicks &amp; conversions
            </h2>
          </div>
          <div className="flex items-center gap-4 font-mono text-[10px] text-bone tracking-wider uppercase">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 bg-accent" /> Clicks
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 border border-accent" /> Sales
            </span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 sm:gap-4 h-48">
          {chart.map((d) => (
            <div key={d.day} className="flex flex-col items-center justify-end gap-2">
              <div className="relative w-full flex-1 flex items-end justify-center gap-0.5">
                <div
                  className="w-1/2 bg-accent transition-all"
                  style={{ height: `${(d.clicks / max) * 100}%` }}
                  title={`${d.clicks} clicks`}
                />
                <div
                  className="w-1/2 border border-accent bg-obsidian transition-all"
                  style={{ height: `${(d.sales * 50 / max) * 100}%`, minHeight: "4px" }}
                  title={`${d.sales} sales`}
                />
              </div>
              <span className="font-mono text-[10px] text-bone tracking-wider">
                {d.day}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent referrals */}
      <div className="bg-carbon border border-slate">
        <div className="flex items-center justify-between p-6 border-b border-slate">
          <h2 className="font-sans font-bold text-paper text-xl">Recent referrals</h2>
          <a
            href="/affiliates/dashboard/payouts"
            className="font-mono text-xs text-accent hover:underline tracking-wider uppercase"
          >
            View all →
          </a>
        </div>
        <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate font-mono text-[10px] text-bone tracking-[0.15em] uppercase">
          <div className="col-span-2">Date</div>
          <div className="col-span-2">Order</div>
          <div className="col-span-4">Product</div>
          <div className="col-span-2 text-right">Sale</div>
          <div className="col-span-2 text-right">Commission</div>
        </div>
        <div>
          {recent.map((r) => (
            <div
              key={r.order}
              className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate last:border-b-0 items-center"
            >
              <div className="col-span-12 sm:col-span-2 font-mono text-xs text-bone">
                {r.date}
              </div>
              <div className="col-span-6 sm:col-span-2 font-mono text-xs text-paper">
                {r.order}
              </div>
              <div className="col-span-6 sm:col-span-4 font-sans text-sm text-paper">
                {r.product}
              </div>
              <div className="col-span-6 sm:col-span-2 sm:text-right font-mono text-sm text-bone">
                ${r.amount.toFixed(2)}
              </div>
              <div className="col-span-6 sm:col-span-2 sm:text-right font-mono text-sm text-accent font-bold">
                ${r.commission.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AffiliateDashboardShell>
  );
}
