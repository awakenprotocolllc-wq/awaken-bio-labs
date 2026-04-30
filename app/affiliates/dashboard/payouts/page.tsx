"use client";

import AffiliateDashboardShell from "@/components/AffiliateDashboardShell";
import { getPayouts, getReferrals } from "@/lib/affiliate-data";

export default function PayoutsPage() {
  const payouts = getPayouts();
  const referrals = getReferrals();
  const pendingTotal = referrals
    .filter((r) => r.status === "Pending" || r.status === "Cleared")
    .reduce((s, r) => s + r.commission, 0);
  const lifetimeTotal = payouts.reduce((s, p) => s + p.amount, 0);

  return (
    <AffiliateDashboardShell title="Payouts.">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-slate mb-10">
        <div className="bg-carbon p-6">
          <p className="font-mono text-[10px] text-bone tracking-[0.2em] uppercase mb-3">
            Pending Payout
          </p>
          <p className="font-sans font-bold text-accent text-3xl">
            ${pendingTotal.toFixed(2)}
          </p>
          <p className="font-mono text-[10px] text-bone mt-2">Pays out May 1, 2026</p>
        </div>
        <div className="bg-carbon p-6">
          <p className="font-mono text-[10px] text-bone tracking-[0.2em] uppercase mb-3">
            Lifetime Earnings
          </p>
          <p className="font-sans font-bold text-paper text-3xl">
            ${(lifetimeTotal + pendingTotal).toFixed(2)}
          </p>
          <p className="font-mono text-[10px] text-bone mt-2">Since joining</p>
        </div>
        <div className="bg-carbon p-6">
          <p className="font-mono text-[10px] text-bone tracking-[0.2em] uppercase mb-3">
            Payout Method
          </p>
          <p className="font-sans font-bold text-paper text-2xl">ACH · ****4421</p>
          <p className="font-mono text-[10px] text-bone mt-2">Twice monthly · 1st &amp; 15th</p>
        </div>
      </div>

      {/* Payout history */}
      <div className="bg-carbon border border-slate mb-10">
        <div className="p-6 border-b border-slate">
          <h2 className="font-sans font-bold text-paper text-xl">Payout history</h2>
        </div>
        <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate font-mono text-[10px] text-bone tracking-[0.15em] uppercase">
          <div className="col-span-3">Date</div>
          <div className="col-span-3">Reference</div>
          <div className="col-span-3">Method</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-right">Amount</div>
        </div>
        {payouts.map((p) => (
          <div
            key={p.reference}
            className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate last:border-b-0 items-center"
          >
            <div className="col-span-6 sm:col-span-3 font-mono text-xs text-bone">
              {p.date}
            </div>
            <div className="col-span-6 sm:col-span-3 font-mono text-xs text-paper">
              {p.reference}
            </div>
            <div className="col-span-6 sm:col-span-3 font-mono text-xs text-bone">
              {p.method}
            </div>
            <div className="col-span-3 sm:col-span-2">
              <span className="inline-block font-mono text-[10px] tracking-wider uppercase border border-accent/40 text-accent px-2 py-0.5">
                {p.status}
              </span>
            </div>
            <div className="col-span-3 sm:col-span-1 text-right font-mono text-sm text-paper font-bold">
              ${p.amount.toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {/* All referrals */}
      <div className="bg-carbon border border-slate">
        <div className="p-6 border-b border-slate">
          <h2 className="font-sans font-bold text-paper text-xl">All referrals</h2>
        </div>
        <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate font-mono text-[10px] text-bone tracking-[0.15em] uppercase">
          <div className="col-span-2">Date</div>
          <div className="col-span-2">Order</div>
          <div className="col-span-4">Product</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Commission</div>
        </div>
        {referrals.map((r) => (
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
            <div className="col-span-6 sm:col-span-2">
              <span
                className={`inline-block font-mono text-[10px] tracking-wider uppercase border px-2 py-0.5 ${
                  r.status === "Paid"
                    ? "border-accent/40 text-accent"
                    : r.status === "Cleared"
                    ? "border-paper/40 text-paper"
                    : "border-bone/40 text-bone"
                }`}
              >
                {r.status}
              </span>
            </div>
            <div className="col-span-6 sm:col-span-2 sm:text-right font-mono text-sm text-accent font-bold">
              ${r.commission.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </AffiliateDashboardShell>
  );
}
