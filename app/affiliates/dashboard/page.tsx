"use client";

import { useEffect, useState } from "react";
import AffiliateDashboardShell from "@/components/AffiliateDashboardShell";
import type { ReferralOrder } from "@/lib/affiliate-db";

type Stats = {
  affiliateCode: string;
  commissionRate: number;
  referrals: ReferralOrder[];
  confirmedEarnings: string;
  pendingEarnings: string;
  totalConversions: number;
};

const STATUS_COLORS: Record<string, string> = {
  pending_payment: "bg-yellow-500/20 text-yellow-400",
  paid: "bg-blue-500/20 text-blue-400",
  fulfilled: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pending",
  paid: "Paid",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
};

export default function DashboardOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/affiliate/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setStats(data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AffiliateDashboardShell title="Overview.">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-carbon border border-slate" />
          ))}
        </div>
      </AffiliateDashboardShell>
    );
  }

  const kpis = stats
    ? [
        {
          label: "Confirmed Earnings",
          value: stats.confirmedEarnings,
          hint: "Fulfilled orders only",
        },
        {
          label: "Pending",
          value: stats.pendingEarnings,
          hint: "Confirmed when order ships",
        },
        {
          label: "Conversions",
          value: String(stats.totalConversions),
          hint: "Active referred orders",
        },
        {
          label: "Commission Rate",
          value: `${Math.round(stats.commissionRate * 100)}%`,
          hint: "Per fulfilled sale",
        },
      ]
    : [];

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
            <p className="font-mono text-xs text-bone mt-2">{k.hint}</p>
          </div>
        ))}
      </div>

      {/* Referral orders */}
      <div className="bg-carbon border border-slate">
        <div className="p-6 border-b border-slate flex items-center justify-between gap-4">
          <h2 className="font-sans font-bold text-paper text-xl">Your referrals</h2>
          {stats && (
            <span className="font-mono text-bone text-xs tracking-wider">
              Code: <span className="text-accent">{stats.affiliateCode}</span>
            </span>
          )}
        </div>

        {!stats || stats.referrals.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-mono text-bone text-sm mb-2">No referrals yet.</p>
            <p className="font-mono text-bone/50 text-xs">
              Share your tracking link from the Links & Codes tab to get started.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate font-mono text-[10px] text-bone tracking-[0.15em] uppercase">
              <div className="col-span-2">Date</div>
              <div className="col-span-2">Order ID</div>
              <div className="col-span-4">Items</div>
              <div className="col-span-2 text-right">Sale</div>
              <div className="col-span-2 text-right">Commission</div>
            </div>
            {stats.referrals.map((r) => (
              <div
                key={r.id}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-6 py-4 border-b border-slate last:border-b-0 items-center"
              >
                <div className="sm:col-span-2 font-mono text-xs text-bone">
                  {new Date(r.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
                <div className="sm:col-span-2 font-mono text-xs text-paper uppercase">
                  #{r.id}
                </div>
                <div className="sm:col-span-4 text-sm text-paper">
                  {r.items.map((i) => `${i.product} · ${i.strength}`).join(", ")}
                </div>
                <div className="sm:col-span-2 sm:text-right font-mono text-sm text-bone">
                  {r.subtotal}
                </div>
                <div className="sm:col-span-2 sm:text-right flex sm:flex-col sm:items-end gap-3 sm:gap-1">
                  <span className="font-mono text-sm text-accent font-bold">{r.commission}</span>
                  <span className={`font-mono text-[9px] px-2 py-0.5 rounded ${STATUS_COLORS[r.status] ?? "text-bone"}`}>
                    {STATUS_LABELS[r.status] ?? r.status}
                  </span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </AffiliateDashboardShell>
  );
}
