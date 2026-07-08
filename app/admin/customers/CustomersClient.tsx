"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { CustomerAccount } from "@/lib/customer-db";

type EnrichedCustomer = CustomerAccount & {
  orderCount: number;
  totalSpend: number;
  lastOrderAt: string | null;
};

type SortKey = "createdAt" | "lastOrderAt" | "orderCount" | "totalSpend";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function CustomersClient({ initialCustomers }: { initialCustomers: EnrichedCustomer[] }) {
  const [customers] = useState(initialCustomers);
  const [search, setSearch]         = useState("");
  const [sortKey, setSortKey]       = useState<SortKey>("createdAt");
  const [optedInOnly, setOptedInOnly] = useState(false);
  const [exporting, setExporting]   = useState(false);

  const filtered = useMemo(() => {
    let list = customers;
    if (optedInOnly) list = list.filter((c) => c.marketingOptIn);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (sortKey === "orderCount") return b.orderCount - a.orderCount;
      if (sortKey === "totalSpend") return b.totalSpend - a.totalSpend;
      if (sortKey === "lastOrderAt") return (b.lastOrderAt ?? "").localeCompare(a.lastOrderAt ?? "");
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [customers, search, sortKey, optedInOnly]);

  function handleExport() {
    setExporting(true);
    const rows = [
      ["Name", "Email", "Marketing Opt-In", "Orders", "Total Spend", "Joined"].join(","),
      ...filtered.map((c) => [
        `"${c.name.replace(/"/g, '""')}"`,
        `"${c.email.replace(/"/g, '""')}"`,
        c.marketingOptIn ? "Yes" : "No",
        c.orderCount,
        c.totalSpend.toFixed(2),
        fmtDate(c.createdAt),
      ].join(",")),
    ].join("\n");

    const blob = new Blob([rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setExporting(false), 500);
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <div className="min-h-screen bg-obsidian">
      {/* Admin nav */}
      <div className="border-b border-slate px-4 sm:px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-6 flex-wrap">
          <h1 className="font-sans font-bold text-paper text-xl">Customer List</h1>
          <div className="flex gap-4">
            <Link href="/admin/orders"    className="font-mono text-bone text-xs tracking-wider hover:text-accent transition-colors">Orders</Link>
            <Link href="/admin/products" className="font-mono text-bone text-xs tracking-wider hover:text-accent transition-colors">Products</Link>
            <Link href="/admin/affiliates" className="font-mono text-bone text-xs tracking-wider hover:text-accent transition-colors">Partners</Link>
            <Link href="/admin/payouts"   className="font-mono text-bone text-xs tracking-wider hover:text-accent transition-colors">Payouts</Link>
            <span className="font-mono text-accent text-xs tracking-wider">Customers</span>
            <Link href="/admin/system"    className="font-mono text-bone text-xs tracking-wider hover:text-accent transition-colors">System</Link>
          </div>
        </div>
        <button onClick={handleLogout} className="font-mono text-bone/40 text-xs hover:text-bone transition-colors">Log out</button>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total Customers", value: customers.length },
            { label: "Verified",        value: customers.filter((c) => c.emailVerified).length },
            { label: "Marketing Opt-In", value: customers.filter((c) => c.marketingOptIn).length },
            { label: "Total Revenue",   value: `$${customers.reduce((s, c) => s + c.totalSpend, 0).toFixed(0)}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-carbon border border-slate px-4 py-4">
              <p className="font-mono text-bone/50 text-[10px] tracking-wider uppercase mb-1">{label}</p>
              <p className="font-sans font-bold text-paper text-2xl">{value}</p>
            </div>
          ))}
        </div>

        {/* Filters + Export */}
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="flex-1 min-w-48 bg-carbon border border-slate text-paper font-sans text-sm px-4 h-10 focus:outline-none focus:border-accent transition-colors placeholder-bone/30"
          />

          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="bg-carbon border border-slate text-paper font-mono text-xs px-3 h-10 focus:outline-none focus:border-accent"
          >
            <option value="createdAt">Sort: Newest</option>
            <option value="lastOrderAt">Sort: Last Order</option>
            <option value="orderCount">Sort: Most Orders</option>
            <option value="totalSpend">Sort: Highest Spend</option>
          </select>

          <label className="flex items-center gap-2 cursor-pointer font-mono text-bone text-xs tracking-wider">
            <input
              type="checkbox"
              checked={optedInOnly}
              onChange={(e) => setOptedInOnly(e.target.checked)}
              className="w-4 h-4 accent-accent"
            />
            Email list only
          </label>

          <button
            onClick={handleExport}
            disabled={exporting || filtered.length === 0}
            className="bg-accent text-obsidian font-mono font-semibold text-xs px-5 h-10 hover:bg-accent/80 transition-colors disabled:opacity-40 tracking-wider"
          >
            {exporting ? "Exporting…" : `Export CSV (${filtered.length})`}
          </button>
        </div>

        {/* Table */}
        <div className="space-y-1">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-[2fr_2fr_80px_110px_120px_90px] gap-3 px-4 py-2">
            {["Name", "Email", "Orders", "Spend", "Last Order", "Joined"].map((h) => (
              <p key={h} className="font-mono text-bone/40 text-[10px] tracking-wider uppercase">{h}</p>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="font-mono text-bone/30 text-sm text-center py-12">No customers found.</p>
          )}

          {filtered.map((c) => (
            <Link
              key={c.id}
              href={`/admin/customers/${c.id}`}
              className="block bg-carbon border border-slate hover:border-accent/40 transition-colors"
            >
              <div className="grid grid-cols-1 sm:grid-cols-[2fr_2fr_80px_110px_120px_90px] gap-3 px-4 py-4 items-center">
                <div>
                  <p className="font-sans font-semibold text-paper text-sm">{c.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {c.emailVerified
                      ? <span className="font-mono text-[9px] text-green-400/70 border border-green-400/20 px-1.5 py-0.5">verified</span>
                      : <span className="font-mono text-[9px] text-yellow-400/70 border border-yellow-400/20 px-1.5 py-0.5">unverified</span>
                    }
                    {c.marketingOptIn && (
                      <span className="font-mono text-[9px] text-accent/60 border border-accent/20 px-1.5 py-0.5">email ✓</span>
                    )}
                  </div>
                </div>
                <p className="font-mono text-bone text-xs sm:text-sm sm:block hidden">{c.email}</p>
                <p className="font-mono text-accent text-sm hidden sm:block">{c.orderCount}</p>
                <p className="font-mono text-accent text-sm hidden sm:block font-bold">${c.totalSpend.toFixed(2)}</p>
                <p className="font-mono text-bone text-xs hidden sm:block">{fmtDate(c.lastOrderAt)}</p>
                <p className="font-mono text-bone/50 text-xs hidden sm:block">{fmtDate(c.createdAt)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
