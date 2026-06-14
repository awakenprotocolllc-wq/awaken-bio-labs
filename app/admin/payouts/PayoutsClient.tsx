"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type OrderDetail = {
  id: string;
  createdAt: string;
  status: string;
  subtotal: string;
  commission: string;
  items: { product: string; strength: string; qty: number; price: string }[];
};

type AffiliateSummary = {
  id: string;
  name: string;
  email: string;
  affiliateCode: string;
  programType: "ambassador" | "licensee";
  commissionRate: number;
  status: string;
  confirmedEarnings: number;
  pendingEarnings: number;
  orderCount: number;
  orders: OrderDetail[];
};

type PayoutsData = {
  totalConfirmed: number;
  totalPending: number;
  ambassadorCount: number;
  licenseeCount: number;
  affiliates: AffiliateSummary[];
  fetchedAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  fulfilled:       "text-green-400",
  paid:            "text-yellow-400",
  pending_payment: "text-bone/60",
  cancelled:       "text-red-400/60",
};

const STATUS_LABEL: Record<string, string> = {
  fulfilled:       "Fulfilled",
  paid:            "Paid",
  pending_payment: "Pending",
  cancelled:       "Cancelled",
};

function fmt(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function groupByMonth(orders: OrderDetail[]) {
  const map = new Map<string, { confirmed: number; pending: number; orders: OrderDetail[] }>();
  for (const o of orders) {
    const key = monthKey(o.createdAt);
    const entry = map.get(key) ?? { confirmed: 0, pending: 0, orders: [] };
    const commission = parseFloat(o.commission.replace(/[^0-9.]/g, "")) || 0;
    if (o.status === "fulfilled") entry.confirmed += commission;
    else entry.pending += commission;
    entry.orders.push(o);
    map.set(key, entry);
  }
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
}

function AffiliateRow({ aff }: { aff: AffiliateSummary }) {
  const [expanded, setExpanded] = useState(false);
  const months = groupByMonth(aff.orders);
  const [openMonth, setOpenMonth] = useState<string | null>(months[0]?.[0] ?? null);

  const hasEarnings = aff.confirmedEarnings > 0 || aff.pendingEarnings > 0;

  return (
    <div className="border border-slate bg-carbon">
      {/* Row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-obsidian/40 transition-colors"
      >
        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <p className="font-sans font-semibold text-paper text-sm">{aff.name}</p>
          <p className="font-mono text-[10px] text-bone/50 mt-0.5 truncate">{aff.email}</p>
        </div>

        {/* Code */}
        <div className="hidden sm:block w-28 shrink-0">
          <p className="font-mono text-accent text-xs">{aff.affiliateCode}</p>
          <p className="font-mono text-[10px] text-bone/40">{Math.round(aff.commissionRate * 100)}% commission</p>
        </div>

        {/* Confirmed */}
        <div className="w-28 shrink-0 text-right">
          <p className={`font-mono text-sm font-bold ${hasEarnings ? "text-green-400" : "text-bone/30"}`}>
            {fmt(aff.confirmedEarnings)}
          </p>
          <p className="font-mono text-[10px] text-bone/40">confirmed</p>
        </div>

        {/* Pending */}
        <div className="w-24 shrink-0 text-right">
          <p className={`font-mono text-sm ${aff.pendingEarnings > 0 ? "text-yellow-400" : "text-bone/30"}`}>
            {fmt(aff.pendingEarnings)}
          </p>
          <p className="font-mono text-[10px] text-bone/40">pending</p>
        </div>

        {/* Orders */}
        <div className="hidden md:block w-16 shrink-0 text-right">
          <p className="font-mono text-paper text-sm">{aff.orderCount}</p>
          <p className="font-mono text-[10px] text-bone/40">orders</p>
        </div>

        {/* Expand chevron */}
        <span className={`font-mono text-bone/40 text-xs ml-2 transition-transform ${expanded ? "rotate-180" : ""}`}>▼</span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate bg-obsidian/60 px-5 py-5 space-y-5">
          {aff.orders.length === 0 ? (
            <p className="font-mono text-bone/40 text-xs">No orders attributed to this affiliate yet.</p>
          ) : (
            <>
              {/* Monthly tabs */}
              {months.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {months.map(([key]) => (
                    <button
                      key={key}
                      onClick={() => setOpenMonth(openMonth === key ? null : key)}
                      className={`font-mono text-[10px] px-3 py-1.5 border tracking-wider transition-colors ${
                        openMonth === key
                          ? "bg-accent/10 text-accent border-accent/40"
                          : "text-bone border-slate hover:border-accent/30 hover:text-accent"
                      }`}
                    >
                      {monthLabel(key)}
                    </button>
                  ))}
                  <button
                    onClick={() => setOpenMonth(null)}
                    className={`font-mono text-[10px] px-3 py-1.5 border tracking-wider transition-colors ${
                      openMonth === null
                        ? "bg-accent/10 text-accent border-accent/40"
                        : "text-bone border-slate hover:border-accent/30"
                    }`}
                  >
                    All
                  </button>
                </div>
              )}

              {/* Monthly summary strip */}
              {openMonth && (() => {
                const entry = months.find(([k]) => k === openMonth)?.[1];
                if (!entry) return null;
                return (
                  <div className="flex gap-6 border border-slate/50 bg-carbon px-4 py-3">
                    <div>
                      <p className="font-mono text-[10px] text-bone/50 uppercase tracking-wider">Month</p>
                      <p className="font-mono text-paper text-sm">{monthLabel(openMonth)}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] text-bone/50 uppercase tracking-wider">Confirmed</p>
                      <p className="font-mono text-green-400 text-sm font-bold">{fmt(entry.confirmed)}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] text-bone/50 uppercase tracking-wider">Pending</p>
                      <p className="font-mono text-yellow-400 text-sm">{fmt(entry.pending)}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] text-bone/50 uppercase tracking-wider">Orders</p>
                      <p className="font-mono text-paper text-sm">{entry.orders.length}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Orders table */}
              <div className="space-y-2">
                {(openMonth
                  ? months.find(([k]) => k === openMonth)?.[1].orders ?? []
                  : aff.orders
                ).map((o) => (
                  <div key={o.id} className="border border-slate/50 bg-carbon px-4 py-3 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-[10px] text-bone/50">{fmtDate(o.createdAt)} · {fmtTime(o.createdAt)}</p>
                        <p className="font-mono text-paper text-xs mt-0.5">#{o.id}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-mono text-[10px] tracking-wider ${STATUS_COLORS[o.status] ?? "text-bone"}`}>
                          {STATUS_LABEL[o.status] ?? o.status}
                        </p>
                        <p className="font-mono text-bone/60 text-xs">Subtotal {o.subtotal}</p>
                        <p className="font-mono text-accent text-sm font-bold">{o.commission}</p>
                      </div>
                    </div>

                    {/* Line items */}
                    <div className="divide-y divide-slate/30">
                      {o.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between py-1.5">
                          <p className="font-sans text-xs text-paper">
                            {item.product}
                            <span className="text-bone/50 ml-1">· {item.strength}</span>
                          </p>
                          <p className="font-mono text-xs text-bone/70 shrink-0 ml-4">
                            {item.qty > 1 ? `${item.qty} × ` : ""}{item.price}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, affiliates }: { title: string; affiliates: AffiliateSummary[] }) {
  if (affiliates.length === 0) return null;
  const totalConfirmed = affiliates.reduce((s, a) => s + a.confirmedEarnings, 0);
  const totalPending = affiliates.reduce((s, a) => s + a.pendingEarnings, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <p className="font-mono text-bone text-[10px] tracking-[0.2em] uppercase">{title} · {affiliates.length}</p>
        <div className="flex items-center gap-4">
          <p className="font-mono text-[10px] text-bone/50">
            Pending: <span className="text-yellow-400">{fmt(totalPending)}</span>
          </p>
          <p className="font-mono text-[10px] text-bone/50">
            Owed: <span className="text-green-400 font-bold">{fmt(totalConfirmed)}</span>
          </p>
        </div>
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-4 px-5 py-2">
        <p className="flex-1 font-mono text-[10px] text-bone/40 uppercase tracking-wider">Partner</p>
        <p className="hidden sm:block w-28 font-mono text-[10px] text-bone/40 uppercase tracking-wider">Code</p>
        <p className="w-28 text-right font-mono text-[10px] text-bone/40 uppercase tracking-wider">Confirmed</p>
        <p className="w-24 text-right font-mono text-[10px] text-bone/40 uppercase tracking-wider">Pending</p>
        <p className="hidden md:block w-16 text-right font-mono text-[10px] text-bone/40 uppercase tracking-wider">Orders</p>
        <span className="w-6" />
      </div>

      <div className="space-y-1">
        {affiliates
          .sort((a, b) => b.confirmedEarnings - a.confirmedEarnings)
          .map((aff) => (
            <AffiliateRow key={aff.id} aff={aff} />
          ))}
      </div>
    </div>
  );
}

export default function PayoutsClient() {
  const [data, setData] = useState<PayoutsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/payouts");
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Failed to load");
      setData(json);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Auto-refresh every 2 minutes
    const interval = setInterval(load, 120_000);
    return () => clearInterval(interval);
  }, [load]);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  const ambassadors = data?.affiliates.filter((a) => a.programType === "ambassador") ?? [];
  const licensees   = data?.affiliates.filter((a) => a.programType === "licensee") ?? [];

  return (
    <div className="min-h-screen bg-obsidian text-paper">
      {/* Header */}
      <div className="bg-carbon border-b border-slate px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="font-mono text-accent text-[10px] tracking-[0.2em] uppercase">Awaken Bio Labs</p>
            <h1 className="font-sans font-bold text-paper text-xl">Payouts</h1>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <Link href="/admin/orders" className="font-mono text-bone text-xs tracking-wider hover:text-accent transition-colors">Orders</Link>
            <span className="text-slate">·</span>
            <Link href="/admin/affiliates" className="font-mono text-bone text-xs tracking-wider hover:text-accent transition-colors">Partners</Link>
            <span className="text-slate">·</span>
            <span className="font-mono text-accent text-xs tracking-wider">Payouts</span>
            <span className="text-slate">·</span>
            <Link href="/admin/system" className="font-mono text-bone text-xs tracking-wider hover:text-accent transition-colors">System</Link>
          </div>
        </div>
        <button onClick={handleLogout} className="font-mono text-bone text-xs tracking-wider hover:text-accent transition-colors">
          Sign Out
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10">

        {/* ── Summary Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Owed", value: data ? fmt(data.totalConfirmed) : "—", sub: "confirmed payouts", accent: true },
            { label: "Total Pending", value: data ? fmt(data.totalPending) : "—", sub: "awaiting fulfillment", yellow: true },
            { label: "Ambassadors", value: data ? String(data.ambassadorCount) : "—", sub: "active partners" },
            { label: "Licensees", value: data ? String(data.licenseeCount) : "—", sub: "active partners" },
          ].map(({ label, value, sub, accent, yellow }) => (
            <div key={label} className="bg-carbon border border-slate px-5 py-4">
              <p className="font-mono text-[10px] text-bone/50 tracking-[0.15em] uppercase mb-1">{label}</p>
              <p className={`font-sans font-bold text-2xl ${accent ? "text-green-400" : yellow ? "text-yellow-400" : "text-paper"}`}>
                {value}
              </p>
              <p className="font-mono text-[10px] text-bone/40 mt-1">{sub}</p>
            </div>
          ))}
        </div>

        {/* ── Refresh bar ── */}
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] text-bone/40">
            {data
              ? `Last updated ${new Date(data.fetchedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} · auto-refreshes every 2 min`
              : loading ? "Loading…" : ""}
          </p>
          <button
            onClick={load}
            disabled={loading}
            className="font-mono text-[10px] text-accent border border-accent/30 px-3 py-1.5 hover:bg-accent/10 transition-colors disabled:opacity-40 tracking-wider"
          >
            {loading ? "Refreshing…" : "↻ Refresh"}
          </button>
        </div>

        {error && (
          <div className="border border-red-500/40 bg-red-500/5 px-4 py-3">
            <p className="font-mono text-red-400 text-xs">{error}</p>
          </div>
        )}

        {loading && !data && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-carbon border border-slate h-14 animate-pulse" />
            ))}
          </div>
        )}

        {data && (
          <>
            <Section title="Ambassadors" affiliates={ambassadors} />
            <Section title="Licensees" affiliates={licensees} />

            {data.affiliates.length === 0 && (
              <p className="font-mono text-bone/40 text-xs text-center py-16">
                No active partners yet.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
