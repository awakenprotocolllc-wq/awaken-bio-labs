"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { products, slugify, categories } from "@/lib/products";

export default function ProductsClient({
  initialOutOfStock,
  initialSubscriberCounts,
}: {
  initialOutOfStock: string[];
  initialSubscriberCounts: Record<string, number>;
}) {
  const [outOfStock, setOutOfStock] = useState<Set<string>>(new Set(initialOutOfStock));
  const [subscriberCounts, setSubscriberCounts] = useState(initialSubscriberCounts);
  const [toggling, setToggling] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryFilter !== "All" && p.category !== categoryFilter) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [categoryFilter, query]);

  const outCount = products.filter((p) => outOfStock.has(slugify(p.name))).length;

  async function toggleStock(slug: string, productName: string) {
    const currentlyOut = outOfStock.has(slug);
    setToggling(slug);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/stock", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, out: !currentlyOut }),
      });
      const data = await res.json();
      if (data.ok) {
        setOutOfStock((prev) => {
          const next = new Set(prev);
          data.out ? next.add(slug) : next.delete(slug);
          return next;
        });
        if (currentlyOut && !data.out) {
          setSubscriberCounts((prev) => {
            const next = { ...prev };
            delete next[slug];
            return next;
          });
          setNotice(
            data.notified > 0
              ? `${productName} restocked — ${data.notified} customer${data.notified !== 1 ? "s" : ""} notified by email.`
              : `${productName} restocked.`
          );
        } else {
          setNotice(`${productName} marked out of stock.`);
        }
      } else {
        setError(data.error ?? "Update failed.");
      }
    } catch {
      setError("Network error — stock was not updated.");
    }
    setToggling(null);
  }

  return (
    <div className="min-h-screen bg-obsidian text-paper">
      {/* Header */}
      <div className="bg-carbon border-b border-slate px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="font-mono text-accent text-[10px] tracking-[0.2em] uppercase">Awaken Bio Labs</p>
            <h1 className="font-sans font-bold text-paper text-xl">Products &amp; Inventory</h1>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <Link href="/admin/orders" className="font-mono text-bone text-xs tracking-wider hover:text-accent transition-colors">Orders</Link>
            <span className="text-slate">·</span>
            <span className="font-mono text-accent text-xs tracking-wider">Products</span>
            <span className="text-slate">·</span>
            <Link href="/admin/affiliates" className="font-mono text-bone text-xs tracking-wider hover:text-accent transition-colors">Partners</Link>
            <span className="text-slate">·</span>
            <Link href="/admin/payouts" className="font-mono text-bone text-xs tracking-wider hover:text-accent transition-colors">Payouts</Link>
            <span className="text-slate">·</span>
            <Link href="/admin/customers" className="font-mono text-bone text-xs tracking-wider hover:text-accent transition-colors">Customers</Link>
            <span className="text-slate">·</span>
            <Link href="/admin/system" className="font-mono text-bone text-xs tracking-wider hover:text-accent transition-colors">System</Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-carbon border border-slate p-4">
            <p className="font-mono text-bone text-[10px] tracking-wider uppercase mb-1">Total Products</p>
            <p className="font-sans font-bold text-paper text-2xl">{products.length}</p>
          </div>
          <div className="bg-carbon border border-slate p-4">
            <p className="font-mono text-bone text-[10px] tracking-wider uppercase mb-1">Out of Stock</p>
            <p className={`font-sans font-bold text-2xl ${outCount > 0 ? "text-red-400" : "text-paper"}`}>{outCount}</p>
          </div>
          <div className="bg-carbon border border-slate p-4">
            <p className="font-mono text-bone text-[10px] tracking-wider uppercase mb-1">Restock Waitlist</p>
            <p className="font-sans font-bold text-accent text-2xl">
              {Object.values(subscriberCounts).reduce((s, n) => s + n, 0)}
            </p>
          </div>
        </div>

        {/* Status messages */}
        {notice && (
          <div className="bg-green-500/10 border border-green-500/40 px-4 py-3">
            <p className="font-mono text-green-400 text-xs tracking-wider">✓ {notice}</p>
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/40 px-4 py-3">
            <p className="font-mono text-red-400 text-xs tracking-wider">✗ {error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="bg-carbon border border-slate text-paper font-sans text-sm px-4 h-10 w-full sm:w-72 focus:outline-none focus:border-accent placeholder:text-bone/30"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-carbon border border-slate text-paper font-mono text-xs px-3 h-10 focus:outline-none focus:border-accent"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Product table */}
        <div className="bg-carbon border border-slate">
          <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-4 border-b border-slate font-mono text-[11px] text-bone tracking-[0.15em] uppercase">
            <div className="col-span-4">Product</div>
            <div className="col-span-3">Category</div>
            <div className="col-span-2">Waitlist</div>
            <div className="col-span-3 text-right">Stock Status</div>
          </div>

          {filtered.map((p) => {
            const slug = slugify(p.name);
            const isOut = outOfStock.has(slug);
            const waiting = subscriberCounts[slug] ?? 0;
            return (
              <div
                key={p.name}
                className="grid grid-cols-2 sm:grid-cols-12 gap-3 sm:gap-4 px-5 py-4 border-b border-slate last:border-b-0 items-center hover:bg-obsidian/40 transition-colors"
              >
                <div className="col-span-2 sm:col-span-4">
                  <p className="font-sans font-bold text-paper text-sm">{p.name}</p>
                  <p className="font-mono text-bone/50 text-[10px] mt-0.5">
                    {p.strengths.join(" · ")}
                  </p>
                </div>
                <div className="hidden sm:block sm:col-span-3 font-mono text-xs text-bone tracking-wide">
                  {p.category}
                </div>
                <div className="col-span-1 sm:col-span-2">
                  {waiting > 0 ? (
                    <span className="font-mono text-[10px] text-accent border border-accent/40 px-2 py-1 tracking-wider">
                      {waiting} WAITING
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] text-bone/30 tracking-wider">—</span>
                  )}
                </div>
                <div className="col-span-1 sm:col-span-3 flex items-center justify-end gap-3">
                  <span className={`font-mono text-[10px] px-2 py-1 border tracking-wider ${
                    isOut
                      ? "bg-red-500/20 text-red-400 border-red-500/40"
                      : "bg-green-500/20 text-green-400 border-green-500/40"
                  }`}>
                    {isOut ? "OUT OF STOCK" : "IN STOCK"}
                  </span>
                  {/* Toggle */}
                  <button
                    onClick={() => toggleStock(slug, p.name)}
                    disabled={toggling === slug}
                    aria-label={`Mark ${p.name} ${isOut ? "in stock" : "out of stock"}`}
                    className={`relative w-12 h-6 shrink-0 border transition-colors disabled:opacity-50 ${
                      isOut ? "bg-red-500/30 border-red-500/60" : "bg-green-500/30 border-green-500/60"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-[18px] w-[18px] transition-all ${
                        isOut ? "left-0.5 bg-red-400" : "left-[26px] bg-green-400"
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="px-5 py-12 text-center text-bone font-mono text-sm">
              No products match.
            </div>
          )}
        </div>

        <p className="font-mono text-bone/40 text-[11px] leading-relaxed max-w-3xl">
          Toggling a product out of stock immediately hides Add to Cart on the storefront and
          blocks checkout for that product. Toggling back in stock automatically emails every
          customer on the restock waitlist and clears the list.
        </p>
      </div>
    </div>
  );
}
