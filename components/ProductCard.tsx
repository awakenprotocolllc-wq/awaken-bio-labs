"use client";

import { motion } from "framer-motion";
import type { Product } from "@/lib/products";

export default function ProductCard({ product, index }: { product: Product; index: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: (index % 8) * 0.05 }}
      className="group relative bg-carbon border border-slate hover:border-accent transition-all duration-200 hover:-translate-y-1 overflow-hidden cursor-pointer flex flex-col"
    >
      <div className="p-5 sm:p-6 flex flex-col gap-4 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-sans font-bold text-paper text-base sm:text-lg leading-tight">
            {product.name}
          </h3>
        </div>

        {/* Molecular decoration */}
        <div className="flex-1 min-h-[60px] flex items-center justify-center opacity-40 group-hover:opacity-70 transition-opacity">
          <svg width="90" height="60" viewBox="0 0 90 60" fill="none">
            <line x1="15" y1="30" x2="45" y2="15" stroke="#57C7D6" strokeWidth="1" />
            <line x1="45" y1="15" x2="75" y2="30" stroke="#57C7D6" strokeWidth="1" />
            <line x1="15" y1="30" x2="45" y2="45" stroke="#57C7D6" strokeWidth="1" />
            <line x1="45" y1="45" x2="75" y2="30" stroke="#57C7D6" strokeWidth="1" />
            <line x1="45" y1="15" x2="45" y2="45" stroke="#57C7D6" strokeWidth="1" />
            <circle cx="15" cy="30" r="3" fill="#57C7D6" />
            <circle cx="45" cy="15" r="3" fill="#57C7D6" />
            <circle cx="45" cy="45" r="3" fill="#57C7D6" />
            <circle cx="75" cy="30" r="3" fill="#57C7D6" />
          </svg>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {product.strengths.map((s) => (
            <span
              key={s}
              className="bg-slate text-accent font-mono text-[11px] px-2.5 py-1 tracking-wide"
            >
              {s}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate">
          <span className="font-mono text-[9px] sm:text-[10px] text-bone tracking-[0.15em]">
            RESEARCH USE ONLY
          </span>
          <span className="font-mono text-[9px] sm:text-[10px] text-bone tracking-wide">
            {product.category}
          </span>
        </div>
      </div>

      {/* Slide-up button */}
      <div className="translate-y-full group-hover:translate-y-0 transition-transform duration-200 bg-accent text-obsidian font-semibold text-sm text-center py-3">
        Select Options →
      </div>
    </motion.div>
  );
}
