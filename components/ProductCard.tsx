"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { type Product, getProductImage, slugify } from "@/lib/products";

export default function ProductCard({ product, index }: { product: Product; index: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: (index % 8) * 0.05 }}
      className="group relative bg-carbon border border-slate hover:border-accent transition-all duration-200 hover:-translate-y-1 overflow-hidden flex flex-col"
    >
      <Link
        href={`/shop/${slugify(product.name)}`}
        className="absolute inset-0 z-10"
        aria-label={product.name}
      />

      <div className="relative aspect-square bg-white border-b border-slate overflow-hidden">
        <Image
          src={getProductImage(product)}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain p-4 sm:p-5 transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="p-5 sm:p-6 flex flex-col gap-4 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-sans font-bold text-paper text-base sm:text-lg leading-tight">
              {product.name}
            </h3>
            {product.subtitle && (
              <p className="font-mono text-bone/60 text-[10px] tracking-wider mt-0.5">
                {product.subtitle}
              </p>
            )}
          </div>
          <span className="font-mono text-accent text-sm font-semibold shrink-0">
            {product.price ?? "—"}
          </span>
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

        <div className="flex items-center justify-between pt-2 border-t border-slate mt-auto">
          <span className="font-mono text-[9px] sm:text-[10px] text-bone tracking-[0.15em]">
            RESEARCH USE ONLY
          </span>
          <span className="font-mono text-[9px] sm:text-[10px] text-accent tracking-wide flex items-center gap-1">
            🇺🇸 MFG IN USA
          </span>
        </div>
      </div>

      <div className="translate-y-full group-hover:translate-y-0 transition-transform duration-200 bg-accent text-obsidian font-semibold text-sm text-center py-3">
        Select Options →
      </div>
    </motion.div>
  );
}
