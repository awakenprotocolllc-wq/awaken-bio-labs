"use client";

import { useMemo, useState } from "react";
import SiteShell from "@/components/SiteShell";
import PageHeader from "@/components/PageHeader";
import { products, slugify, getCoaForStrength } from "@/lib/products";

// Flatten all products into per-row entries (one per strength)
const coaRows = products.flatMap((p) =>
  p.strengths.map((s) => ({
    name: p.name,
    category: p.category,
    strength: s,
    coa: getCoaForStrength(p, s),
  }))
);

export default function COAsPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return coaRows;
    return coaRows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <SiteShell>
      <PageHeader
        eyebrow="TRANSPARENCY"
        title="Certificates of Analysis."
        subtitle="Every batch independently tested by a US third-party laboratory. COAs are available for all current inventory — additional reports are published on a rolling basis as new batches are tested."
      />

      <section className="bg-obsidian py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Search */}
          <div className="mb-10 relative max-w-xl">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search compounds (e.g. BPC-157, NAD+)…"
              className="w-full bg-carbon border border-slate text-paper placeholder:text-bone/60 font-sans px-4 h-12 min-h-[44px] focus:border-accent focus:outline-none transition-colors"
            />
            <svg
              className="absolute right-4 top-1/2 -translate-y-1/2 text-bone"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>

          <p className="font-mono text-bone text-xs tracking-wider mb-6">
            {filtered.length} {filtered.length === 1 ? "RESULT" : "RESULTS"}
          </p>

          {/* Table */}
          <div className="bg-carbon border border-slate">
            <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-4 border-b border-slate font-mono text-[11px] text-bone tracking-[0.15em] uppercase">
              <div className="col-span-5">Compound</div>
              <div className="col-span-3">Category</div>
              <div className="col-span-2">Strength</div>
              <div className="col-span-2 text-right">COA</div>
            </div>

            <div>
              {filtered.map((row, i) => (
                <div
                  key={`${row.name}-${row.strength}-${i}`}
                  className="grid grid-cols-12 gap-4 px-5 py-5 border-b border-slate last:border-b-0 hover:bg-obsidian transition-colors items-center"
                >
                  <div className="col-span-12 sm:col-span-5">
                    <a
                      href={`/shop/${slugify(row.name)}`}
                      className="font-sans font-bold text-paper hover:text-accent transition-colors"
                    >
                      {row.name}
                    </a>
                  </div>

                  <div className="col-span-6 sm:col-span-3 font-mono text-xs text-bone tracking-wide">
                    {row.category}
                  </div>

                  <div className="col-span-6 sm:col-span-2">
                    <span className="font-mono text-[10px] text-accent bg-slate px-2 py-0.5">
                      {row.strength}
                    </span>
                  </div>

                  <div className="col-span-12 sm:col-span-2 sm:text-right">
                    {!row.coa || row.coa === "pending" ? (
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs text-bone/50 border border-slate px-3 h-9">
                        <span className="w-1.5 h-1.5 rounded-full bg-bone/30" />
                        COA PENDING
                      </span>
                    ) : (
                      <a
                        href={row.coa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 font-mono text-xs text-accent border border-accent/40 hover:border-accent hover:bg-accent/10 px-3 h-9 transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                        VIEW COA
                      </a>
                    )}
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="px-5 py-12 text-center text-bone font-mono text-sm">
                  No results. Try another term.
                </div>
              )}
            </div>
          </div>

          <p className="font-mono text-bone text-[11px] mt-6 leading-relaxed max-w-3xl">
            COAs are issued per batch. The PDF you download corresponds to the most recent
            production run. Products marked &ldquo;COA Pending&rdquo; have documentation in progress —
            contact support if you need a COA before placing an order. For batch-specific
            COAs matching a previous order, contact support with your order number.
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
