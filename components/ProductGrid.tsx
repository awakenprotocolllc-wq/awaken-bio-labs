"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { categories, products } from "@/lib/products";
import ProductCard from "./ProductCard";

export default function ProductGrid() {
  const [active, setActive] = useState<(typeof categories)[number]>("All");

  const filtered = useMemo(
    () => (active === "All" ? products : products.filter((p) => p.category === active)),
    [active]
  );

  return (
    <section id="catalog" className="bg-obsidian py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-10 md:mb-14">
          <p className="font-mono text-accent text-xs tracking-[0.25em] mb-4">
            — CATALOG —
          </p>
          <h2 className="font-sans font-bold text-paper text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1]">
            62 Research Compounds.
          </h2>
          <p className="text-bone mt-4 text-base sm:text-lg">
            Zero compromises on purity or potency.
          </p>
        </div>

        {/* Filter pills */}
        <div className="no-scrollbar -mx-4 sm:mx-0 overflow-x-auto mb-10">
          <div className="flex gap-3 px-4 sm:px-0 whitespace-nowrap">
            {categories.map((c) => {
              const isActive = c === active;
              return (
                <button
                  key={c}
                  onClick={() => setActive(c)}
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

        {/* Grid */}
        <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          <AnimatePresence mode="popLayout">
            {filtered.map((p, i) => (
              <ProductCard key={p.name} product={p} index={i} />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
