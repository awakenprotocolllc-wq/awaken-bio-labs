"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { products, slugify, getProductImage } from "@/lib/products";

const KEY = "awaken_rv";

function getFirstCoaLocal(product: (typeof products)[number]): string | undefined {
  if (product.coaMap) {
    const first = Object.values(product.coaMap).find(Boolean);
    if (first) return first;
  }
  if (product.coa && product.coa !== "pending") return product.coa;
  return undefined;
}

export default function RecentlyViewedProducts() {
  const [names, setNames] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setNames(JSON.parse(raw));
    } catch {
      // localStorage unavailable
    }
  }, []);

  const viewed = names
    .map((name) => products.find((p) => p.name === name))
    .filter(Boolean) as typeof products;

  if (viewed.length === 0) return null;

  return (
    <section className="bg-carbon border-t border-slate py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <p className="font-mono text-accent text-xs tracking-[0.25em] mb-3">— RECENTLY VIEWED —</p>
          <h2 className="font-sans font-bold text-paper text-3xl sm:text-4xl tracking-tight">Recently Viewed.</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {viewed.map((product) => {
            const slug = slugify(product.name);
            const coaUrl = getFirstCoaLocal(product);

            return (
              <div
                key={product.name}
                className="group bg-obsidian border border-slate hover:border-accent transition-all duration-200 hover:-translate-y-0.5 flex flex-col overflow-hidden"
              >
                <div className="relative aspect-square bg-white border-b border-slate overflow-hidden">
                  <Image
                    src={getProductImage(product)}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                    className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-3 flex flex-col gap-2 flex-1">
                  <h3 className="font-sans font-bold text-paper text-xs leading-tight">{product.name}</h3>
                  <div className="flex flex-wrap gap-1">
                    {product.strengths.map((s) => (
                      <span key={s} className="bg-slate text-accent font-mono text-[9px] px-1.5 py-0.5">{s}</span>
                    ))}
                  </div>
                  {product.price && (
                    <p className="font-mono text-accent text-xs font-semibold">{product.price}</p>
                  )}
                  <div className="flex flex-col gap-1.5 mt-auto pt-2 border-t border-slate">
                    <Link
                      href={`/shop/${slug}`}
                      className="w-full text-center bg-accent text-obsidian font-mono font-semibold text-[9px] tracking-wider uppercase py-1.5 hover:bg-accent/80 transition-colors"
                    >
                      View Product
                    </Link>
                    {coaUrl && (
                      <a
                        href={coaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full text-center border border-accent/50 text-accent font-mono text-[9px] tracking-wider uppercase py-1.5 hover:bg-accent/10 transition-colors"
                      >
                        COA
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
