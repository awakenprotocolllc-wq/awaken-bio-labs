"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { ReferralOrder } from "@/lib/affiliate-db";

type PortalStats = {
  ok: boolean;
  name: string;
  email: string;
  affiliateCode: string;
  commissionRate: number;
  programType: string;
  status: string;
  joinedAt: string;
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

export default function AdminPortalView() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [stats, setStats] = useState<PortalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/affiliates/${params.id}/stats`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) {
          setError(data.error ?? "Could not load partner data.");
        } else {
          setStats(data);
        }
      })
      .catch(() => setError("Network error."))
      .finally(() => setLoading(false));
  }, [params.id]);

  return (
    <div className="min-h-screen bg-obsidian">
      {/* Admin banner */}
      <div className="bg-yellow-500/10 border-b border-yellow-500/30 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono text-yellow-400 text-xs tracking-[0.2em] uppercase font-bold">
            ⚠ Admin View
          </span>
          {stats && (
            <span className="font-mono text-yellow-400/70 text-xs">
              Viewing portal as: <span className="text-yellow-300">{stats.name}</span>{" "}
              <span className="text-yellow-400/50">({stats.email})</span>
            </span>
          )}
        </div>
        <Link
          href="/admin/affiliates"
          className="font-mono text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
        >
          ← Back to Admin
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {loading && (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-carbon border border-slate" />
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 p-6 text-center">
            <p className="text-red-400 font-mono text-sm">{error}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 font-mono text-xs text-bone hover:text-accent"
            >
              ← Go back
            </button>
          </div>
        )}

        {stats && (
          <>
            {/* Partner info header */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
              <div>
                <p className="font-mono text-accent text-xs tracking-[0.25em] mb-1 uppercase">
                  — {stats.programType} portal —
                </p>
                <h1 className="font-sans font-bold text-paper text-3xl sm:text-4xl tracking-tight">
                  {stats.name}
                </h1>
                <p className="text-bone font-mono text-sm mt-1">{stats.email}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <span className="font-mono text-xs bg-carbon border border-slate px-3 py-1.5 text-bone">
                  Code: <span className="text-accent">{stats.affiliateCode}</span>
                </span>
                <span className={`font-mono text-xs px-3 py-1.5 border ${
                  stats.status === "active"
                    ? "bg-green-500/10 border-green-500/30 text-green-400"
                    : stats.status === "suspended"
                    ? "bg-red-500/10 border-red-500/30 text-red-400"
                    : "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                }`}>
                  {stats.status}
                </span>
              </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate mb-10">
              {[
                {
                  label: "Confirmed Earnings",
                  value: stats.confirmedEarnings,
                  hint: "Fulfilled orders only",
                },
                {
                  label: "Pending",
                  value: stats.pendingEarnings,
                  hint: "Awaiting fulfillment",
                },
                {
                  label: "Conversions",
                  value: String(stats.totalConversions),
                  hint: "Active referred orders",
                },
                {
                  label: "Commission Rate",
                  value: `${Math.round(stats.commissionRate * 100)}%`,
                  hint: `${stats.programType} program`,
                },
              ].map((k) => (
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

            {/* Referral Orders */}
            <div className="bg-carbon border border-slate">
              <div className="p-6 border-b border-slate flex items-center justify-between gap-4">
                <h2 className="font-sans font-bold text-paper text-xl">Referral orders</h2>
                <span className="font-mono text-bone text-xs tracking-wider">
                  Code: <span className="text-accent">{stats.affiliateCode}</span>
                </span>
              </div>

              {stats.referrals.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="font-mono text-bone text-sm mb-2">No referrals yet.</p>
                  <p className="font-mono text-bone/50 text-xs">
                    Partner hasn&apos;t generated any sales yet.
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
                        <span className="font-mono text-sm text-accent font-bold">
                          {r.commission}
                        </span>
                        <span
                          className={`font-mono text-[9px] px-2 py-0.5 rounded ${
                            STATUS_COLORS[r.status] ?? "text-bone"
                          }`}
                        >
                          {STATUS_LABELS[r.status] ?? r.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Joined date */}
            <p className="mt-6 font-mono text-[10px] text-bone/40 tracking-wide text-center">
              Partner since{" "}
              {new Date(stats.joinedAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
