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
  pending_payment: "border-yellow-500/40 text-yellow-400",
  paid:            "border-blue-500/40 text-blue-400",
  fulfilled:       "border-accent/40 text-accent",
  cancelled:       "border-red-500/40 text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pending",
  paid:            "Paid",
  fulfilled:       "Fulfilled",
  cancelled:       "Cancelled",
};

export default function PayoutsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/affiliate/stats")
      .then((r) => r.json())
      .then((data) => { if (data.ok) setStats(data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AffiliateDashboardShell title="Payouts.">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-carbon border border-slate" />)}
        </div>
      </AffiliateDashboardShell>
    );
  }

  const confirmedEarnings = stats?.confirmedEarnings ?? "$0.00";
  const pendingEarnings = stats?.pendingEarnings ?? "$0.00";
  const referrals = stats?.referrals ?? [];

  // Lifetime = confirmed + pending (nothing has been paid out yet)
  const parseAmt = (s: string) => parseFloat(s.replace(/[^0-9.]/g, "")) || 0;
  const lifetimeTotal = parseAmt(confirmedEarnings) + parseAmt(pendingEarnings);

  return (
    <AffiliateDashboardShell title="Payouts.">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-slate mb-10">
        <div className="bg-carbon p-6">
          <p className="font-mono text-[10px] text-bone tracking-[0.2em] uppercase mb-3">
            Confirmed Earnings
          </p>
          <p className="font-sans font-bold text-accent text-3xl">{confirmedEarnings}</p>
          <p className="font-mono text-[10px] text-bone mt-2">From fulfilled orders</p>
        </div>
        <div className="bg-carbon p-6">
          <p className="font-mono text-[10px] text-bone tracking-[0.2em] uppercase mb-3">
            Pending Earnings
          </p>
          <p className="font-sans font-bold text-paper text-3xl">{pendingEarnings}</p>
          <p className="font-mono text-[10px] text-bone mt-2">Confirmed when order ships</p>
        </div>
        <div className="bg-carbon p-6">
          <p className="font-mono text-[10px] text-bone tracking-[0.2em] uppercase mb-3">
            Lifetime Total
          </p>
          <p className="font-sans font-bold text-paper text-3xl">${lifetimeTotal.toFixed(2)}</p>
          <p className="font-mono text-[10px] text-bone mt-2">Since joining</p>
        </div>
      </div>

      {/* Payout history */}
      <div className="bg-carbon border border-slate mb-10">
        <div className="p-6 border-b border-slate">
          <h2 className="font-sans font-bold text-paper text-xl">Payout history</h2>
        </div>
        <div className="p-10 text-center">
          <p className="font-mono text-bone text-sm mb-2">No payouts processed yet.</p>
          <p className="font-mono text-bone/50 text-xs">
            Payouts are issued manually. Contact your program manager to arrange payment.
          </p>
        </div>
      </div>

      {/* Referral orders */}
      <div className="bg-carbon border border-slate">
        <div className="p-6 border-b border-slate flex items-center justify-between gap-4">
          <h2 className="font-sans font-bold text-paper text-xl">All referrals</h2>
          {stats && (
            <span className="font-mono text-bone text-xs tracking-wider">
              Code: <span className="text-accent">{stats.affiliateCode}</span>
            </span>
          )}
        </div>

        {referrals.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-mono text-bone text-sm mb-2">No referrals yet.</p>
            <p className="font-mono text-bone/50 text-xs">
              Share your tracking link from the Links &amp; Codes tab to get started.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate font-mono text-[10px] text-bone tracking-[0.15em] uppercase">
              <div className="col-span-2">Date</div>
              <div className="col-span-2">Order</div>
              <div className="col-span-4">Items</div>
              <div className="col-span-2 text-right">Sale</div>
              <div className="col-span-2 text-right">Commission</div>
            </div>
            {referrals.map((r) => (
              <div
                key={r.id}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-6 py-4 border-b border-slate last:border-b-0 items-center"
              >
                <div className="sm:col-span-2 font-mono text-xs text-bone">
                  {new Date(r.createdAt).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
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
                  <span className={`font-mono text-[9px] px-2 py-0.5 border ${STATUS_COLORS[r.status] ?? "border-bone/40 text-bone"}`}>
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
