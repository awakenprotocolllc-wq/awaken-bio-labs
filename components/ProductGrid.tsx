"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { categories, products } from "@/lib/products";
import ProductCard from "./ProductCard";

// ---------------------------------------------------------------------------
// Popularity ranking — manually ordered; can be replaced with sales data later
// ---------------------------------------------------------------------------
const POPULARITY_ORDER: Record<string, number> = {
  "GLP3-R (Retatrutide)": 1,
  "BPC-157": 2,
  "TB-500": 3,
  "GLOW": 4,
  "NAD+": 5,
  "MOTS-C": 6,
  "GHK-Cu": 7,
  "CJC-1295 (with DAC)": 8,
  "Ipamorelin": 9,
  "Selank": 10,
  "Epithalon": 11,
  "Wolverine Blend": 12,
};

function popularityOf(name: string) {
  return POPULARITY_ORDER[name] ?? 999;
}

// Parse minimum numeric price from a price string like "$102.00 – $261.00" or "$65.00"
function parseMinPrice(price: string | null): number {
  if (!price) return Infinity;
  const match = price.match(/\$([\d.]+)/);
  return match ? parseFloat(match[1]) : Infinity;
}

// Parse numeric mg/ml value from a strength string like "10mg", "500mg", "10ml"
function parseSize(s: string): number {
  const match = s.match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : 0;
}

// All unique sizes across the catalogue, sorted numerically
const ALL_SIZES = Array.from(new Set(products.flatMap((p) => p.strengths)))
  .sort((a, b) => parseSize(a) - parseSize(b));

type SortBy = "default" | "popularity" | "price-asc" | "price-desc" | "size-asc" | "size-desc";
type PriceRange = "all" | "under50" | "50to100" | "over100";

export default function ProductGrid() {
  const [active, setActive]           = useState<(typeof categories)[number]>("All");
  const [search, setSearch]           = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sortBy, setSortBy]           = useState<SortBy>("default");
  const [priceRange, setPriceRange]   = useState<PriceRange>("all");
  const [sizeFilter, setSizeFilter]   = useState<string>("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const hasActiveFilters = active !== "All" || priceRange !== "all" || sizeFilter !== "" || sortBy !== "default";

  // Autocomplete suggestions
  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((p) => p.name.toLowerCase().includes(q) || p.subtitle?.toLowerCase().includes(q))
      .map((p) => p.name)
      .slice(0, 6);
  }, [search]);

  // Filtered + sorted products
  const filtered = useMemo(() => {
    let result = active === "All" ? [...products] : products.filter((p) => p.category === active);

    // Text search
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.subtitle?.toLowerCase().includes(q)
      );
    }

    // Price range
    if (priceRange !== "all") {
      result = result.filter((p) => {
        const price = parseMinPrice(p.price);
        if (priceRange === "under50")  return price < 50;
        if (priceRange === "50to100")  return price >= 50 && price <= 100;
        if (priceRange === "over100")  return price > 100;
        return true;
      });
    }

    // Size filter — product must have the selected strength
    if (sizeFilter) {
      result = result.filter((p) => p.strengths.includes(sizeFilter));
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === "popularity")  return popularityOf(a.name) - popularityOf(b.name);
      if (sortBy === "price-asc")   return parseMinPrice(a.price) - parseMinPrice(b.price);
      if (sortBy === "price-desc")  return parseMinPrice(b.price) - parseMinPrice(a.price);
      if (sortBy === "size-asc")    return parseSize(a.strengths[0]) - parseSize(b.strengths[0]);
      if (sortBy === "size-desc")   return parseSize(b.strengths[0]) - parseSize(a.strengths[0]);
      return 0; // default — preserve catalogue order
    });

    return result;
  }, [active, search, priceRange, sizeFilter, sortBy]);

  function selectSuggestion(name: string) {
    setSearch(name);
    setShowSuggestions(false);
    setActive("All");
  }

  function clearSearch() {
    setSearch("");
    setShowSuggestions(false);
  }

  function resetAll() {
    setActive("All");
    setPriceRange("all");
    setSizeFilter("");
    setSortBy("default");
    clearSearch();
  }

  return (
    <section id="catalog" className="bg-obsidian py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-10 md:mb-14">
          <p className="font-mono text-accent text-xs tracking-[0.25em] mb-4">— CATALOG —</p>
          <h2 className="font-sans font-bold text-paper text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1]">
            {products.length} Research Compounds.
          </h2>
          <p className="text-bone mt-4 text-base sm:text-lg">
            All compounds for in-vitro research use only. Not for diagnostic, clinical, or other regulated applications.
          </p>
        </div>

        {/* Search bar */}
        <div ref={searchRef} className="relative mb-6">
          <div className="relative flex items-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="absolute left-4 text-bone/40 shrink-0 pointer-events-none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Search compounds — e.g. BPC-157, Semax, Ipamorelin..."
              className="w-full bg-carbon border border-slate text-paper placeholder-bone/30 font-mono text-sm pl-11 pr-10 h-12 focus:outline-none focus:border-accent transition-colors"
            />
            {search && (
              <button type="button" onClick={clearSearch} className="absolute right-4 text-bone/40 hover:text-accent transition-colors" aria-label="Clear search">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
                </svg>
              </button>
            )}
          </div>

          {/* Autocomplete */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 bg-carbon border border-accent/40 shadow-xl mt-1">
              {suggestions.map((name) => {
                const q = search.trim().toLowerCase();
                const idx = name.toLowerCase().indexOf(q);
                return (
                  <button key={name} type="button" onMouseDown={() => selectSuggestion(name)}
                    className="w-full text-left px-4 py-3 font-mono text-sm text-bone hover:bg-accent/10 hover:text-accent transition-colors flex items-center gap-3 border-b border-slate last:border-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-accent/50 shrink-0">
                      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
                    </svg>
                    <span>
                      {idx >= 0 ? (
                        <>{name.slice(0, idx)}<span className="text-accent font-bold">{name.slice(idx, idx + q.length)}</span>{name.slice(idx + q.length)}</>
                      ) : name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Filter & Sort controls ── */}
        {/* Mobile toggle */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center gap-2 font-mono text-xs tracking-wider uppercase text-bone border border-slate px-4 h-10 hover:border-accent hover:text-accent transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M7 12h10M11 18h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
            </svg>
            Filters &amp; Sort
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            )}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className={`ml-auto transition-transform ${filtersOpen ? "rotate-180" : ""}`}>
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
            </svg>
          </button>
        </div>

        {/* Filter panel — always visible on md+, collapsible on mobile */}
        <div className={`${filtersOpen ? "block" : "hidden"} md:block mb-8`}>
          <div className="bg-carbon border border-slate p-5 space-y-5">
            {/* Row 1: Category + Sort */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-bone/50 text-[10px] tracking-wider uppercase mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => {
                    const isActive = c === active;
                    return (
                      <button key={c} onClick={() => { setActive(c); clearSearch(); }}
                        className={`font-mono text-[10px] tracking-wider uppercase px-3 h-8 border transition-colors ${
                          isActive ? "border-accent text-accent bg-accent/10" : "border-slate text-bone hover:border-accent hover:text-accent"
                        }`}>
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-mono text-bone/50 text-[10px] tracking-wider uppercase mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="w-full bg-obsidian border border-slate text-paper font-mono text-xs px-3 h-9 focus:outline-none focus:border-accent transition-colors appearance-none"
                >
                  <option value="default">Default Order</option>
                  <option value="popularity">Popularity</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="size-asc">Size: Low to High</option>
                  <option value="size-desc">Size: High to Low</option>
                </select>
              </div>
            </div>

            {/* Row 2: Price range + Size */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-bone/50 text-[10px] tracking-wider uppercase mb-2">Price Range</label>
                <div className="flex flex-wrap gap-2">
                  {([
                    { val: "all",      label: "All" },
                    { val: "under50",  label: "Under $50" },
                    { val: "50to100",  label: "$50–$100" },
                    { val: "over100",  label: "$100+" },
                  ] as { val: PriceRange; label: string }[]).map(({ val, label }) => (
                    <button key={val} onClick={() => setPriceRange(val)}
                      className={`font-mono text-[10px] tracking-wider uppercase px-3 h-8 border transition-colors ${
                        priceRange === val ? "border-accent text-accent bg-accent/10" : "border-slate text-bone hover:border-accent hover:text-accent"
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-mono text-bone/50 text-[10px] tracking-wider uppercase mb-2">MG / ML Size</label>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setSizeFilter("")}
                    className={`font-mono text-[10px] tracking-wider uppercase px-3 h-8 border transition-colors ${
                      sizeFilter === "" ? "border-accent text-accent bg-accent/10" : "border-slate text-bone hover:border-accent hover:text-accent"
                    }`}>
                    Any
                  </button>
                  {ALL_SIZES.map((s) => (
                    <button key={s} onClick={() => setSizeFilter(sizeFilter === s ? "" : s)}
                      className={`font-mono text-[10px] tracking-wider uppercase px-3 h-8 border transition-colors ${
                        sizeFilter === s ? "border-accent text-accent bg-accent/10" : "border-slate text-bone hover:border-accent hover:text-accent"
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Reset */}
            {hasActiveFilters && (
              <div className="border-t border-slate pt-4">
                <button onClick={resetAll}
                  className="font-mono text-xs text-bone/50 hover:text-accent transition-colors tracking-wider uppercase flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
                  </svg>
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Category pill bar (desktop quick-access) */}
        <div className="no-scrollbar -mx-4 sm:mx-0 overflow-x-auto mb-8 hidden md:block">
          <div className="flex gap-3 px-4 sm:px-0 whitespace-nowrap">
            {categories.map((c) => {
              const isActive = c === active;
              return (
                <button key={c} onClick={() => { setActive(c); clearSearch(); }}
                  className={`font-mono text-xs tracking-wider uppercase px-4 h-11 min-h-[44px] border transition-colors duration-200 ${
                    isActive ? "border-accent text-accent bg-carbon" : "border-slate text-bone hover:border-accent hover:text-accent"
                  }`}>
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results count + active filter summary */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <p className="font-mono text-bone/40 text-[11px] tracking-wider uppercase">
            {filtered.length} compound{filtered.length !== 1 ? "s" : ""} found
            {sortBy !== "default" && ` · sorted by ${sortBy.replace("-", " ").replace("asc", "↑").replace("desc", "↓")}`}
          </p>
          {hasActiveFilters && (
            <button onClick={resetAll} className="font-mono text-accent text-[11px] tracking-wider hover:underline uppercase">
              Reset filters
            </button>
          )}
        </div>

        {/* No results */}
        {filtered.length === 0 && (
          <div className="py-20 text-center border border-slate bg-carbon">
            <p className="font-mono text-bone/50 text-sm mb-2">No products match your selected filters.</p>
            <p className="font-mono text-bone/30 text-xs mb-6">Try adjusting your search or clearing the active filters.</p>
            <button onClick={resetAll} className="font-mono text-accent text-xs border border-accent px-6 h-10 hover:bg-accent/10 transition-colors tracking-wider uppercase">
              Clear All Filters
            </button>
          </div>
        )}

        {/* Product grid */}
        <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          <AnimatePresence mode="popLayout">
            {filtered.flatMap((p, i) => {
              const cards: React.ReactNode[] = [<ProductCard key={p.name} product={p} />];
              if ((i + 1) % 10 === 0 && i + 1 < filtered.length) {
                cards.push(
                  <motion.div
                    key={`trust-${Math.floor(i / 10)}`}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="col-span-2 md:col-span-3 lg:col-span-4 border border-slate bg-carbon/50 px-6 py-5"
                  >
                    <div className="flex flex-wrap gap-6 sm:gap-10 items-center justify-center sm:justify-start">
                      {[
                        { label: "≥99% Purity", sub: "HPLC Verified" },
                        { label: "US Manufactured", sub: "Domestic Production" },
                        { label: "Third-Party Tested", sub: "Independent US Labs" },
                        { label: "COA Available", sub: "Download Anytime" },
                      ].map(({ label, sub }) => (
                        <div key={label} className="flex items-center gap-3">
                          <span className="text-accent text-lg font-mono">✓</span>
                          <div>
                            <p className="font-mono text-paper text-xs font-semibold tracking-wide">{label}</p>
                            <p className="font-mono text-bone/50 text-[10px] tracking-wider">{sub}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              }
              return cards;
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
