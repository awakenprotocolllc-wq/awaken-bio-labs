"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { categories, products } from "@/lib/products";
import ProductCard from "./ProductCard";

export default function ProductGrid() {
  const [active, setActive] = useState<(typeof categories)[number]>("All");
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Autocomplete suggestions — match name or subtitle
  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.subtitle?.toLowerCase().includes(q)
      )
      .map((p) => p.name)
      .slice(0, 6);
  }, [search]);

  // Filtered products — category + search
  const filtered = useMemo(() => {
    let result = active === "All" ? products : products.filter((p) => p.category === active);
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.subtitle?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [active, search]);

  function selectSuggestion(name: string) {
    setSearch(name);
    setShowSuggestions(false);
    setActive("All");
  }

  function clearSearch() {
    setSearch("");
    setShowSuggestions(false);
  }

  return (
    <section id="catalog" className="bg-obsidian py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-10 md:mb-14">
          <p className="font-mono text-accent text-xs tracking-[0.25em] mb-4">
            — CATALOG —
          </p>
          <h2 className="font-sans font-bold text-paper text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1]">
            {products.length} Research Compounds.
          </h2>
          <p className="text-bone mt-4 text-base sm:text-lg">
            All compounds intended for in-vitro research use only. Not for human or veterinary use.
          </p>
        </div>

        {/* Search bar */}
        <div ref={searchRef} className="relative mb-6">
          <div className="relative flex items-center">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className="absolute left-4 text-bone/40 shrink-0 pointer-events-none"
            >
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Search compounds — e.g. BPC-157, Semax, Ipamorelin..."
              className="w-full bg-carbon border border-slate text-paper placeholder-bone/30 font-mono text-sm pl-11 pr-10 h-12 focus:outline-none focus:border-accent transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-4 text-bone/40 hover:text-accent transition-colors"
                aria-label="Clear search"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
                </svg>
              </button>
            )}
          </div>

          {/* Autocomplete dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 bg-carbon border border-accent/40 shadow-xl mt-1">
              {suggestions.map((name) => {
                const q = search.trim().toLowerCase();
                const idx = name.toLowerCase().indexOf(q);
                return (
                  <button
                    key={name}
                    type="button"
                    onMouseDown={() => selectSuggestion(name)}
                    className="w-full text-left px-4 py-3 font-mono text-sm text-bone hover:bg-accent/10 hover:text-accent transition-colors flex items-center gap-3 border-b border-slate last:border-0"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-accent/50 shrink-0">
                      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
                    </svg>
                    <span>
                      {idx >= 0 ? (
                        <>
                          {name.slice(0, idx)}
                          <span className="text-accent font-bold">{name.slice(idx, idx + q.length)}</span>
                          {name.slice(idx + q.length)}
                        </>
                      ) : name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Filter pills */}
        <div className="no-scrollbar -mx-4 sm:mx-0 overflow-x-auto mb-10">
          <div className="flex gap-3 px-4 sm:px-0 whitespace-nowrap">
            {categories.map((c) => {
              const isActive = c === active;
              return (
                <button
                  key={c}
                  onClick={() => { setActive(c); clearSearch(); }}
                  className={`font-mono text-xs tracking-wider uppercase px-4 h-11 min-h-[44px] border transition-colors duration-200 ${
                    isActive
                      ? "border-accent text-accent bg-carbon"
                      : "border-slate text-bone hover:border-accent hover:text-accent"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* No results */}
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <p className="font-mono text-bone/50 text-sm">No compounds found for &ldquo;{search}&rdquo;</p>
            <button onClick={clearSearch} className="font-mono text-accent text-xs mt-3 hover:underline">
              Clear search
            </button>
          </div>
        )}

        {/* Grid */}
        <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          <AnimatePresence mode="popLayout">
            {filtered.map((p) => (
              <ProductCard key={p.name} product={p} />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
