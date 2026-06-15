"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { products, slugify, getProductImage, getPriceForStrength } from "@/lib/products";

// Featured product names in display order
const FEATURED_NAMES = [
  "GLP3-R (Retatrutide)",
  "Glow",
  "NAD+",
  "MOTS-C",
  "GHK-Cu",
];

function getStartingPrice(product: (typeof products)[number]): string {
  if (!product.price) return "—";
  // Range price — extract the lower bound
  if (product.price.includes("–")) return "From " + product.price.split("–")[0].trim();
  return product.price;
}

function getFirstCoa(product: (typeof products)[number]): string | undefined {
  // Check coaMap first, then coa field
  if (product.coaMap) {
    const first = Object.values(product.coaMap).find(Boolean);
    if (first) return first;
  }
  if (product.coa && product.coa !== "pending") return product.coa;
  return undefined;
}

export default function PopularResearchCompounds() {
  const featured = FEATURED_NAMES.map((name) => products.find((p) => p.name === name)).filter(Boolean) as typeof products;

  if (featured.length === 0) return null;

  return (
    <section className="bg-obsidian border-t border-slate py-20 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-12">
          <p className="font-mono text-accent text-xs tracking-[0.25em] mb-4">— POPULAR —</p>
          <h2 className="font-sans font-bold text-paper text-4xl sm:text-5xl tracking-tight leading-[1]">
            Popular Research Compounds.
          </h2>
          <p className="text-bone mt-3 text-base">
            A quick-access selection of frequently viewed research compounds. For in-vitro use only.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {featured.map((product, i) => {
            const slug = slugify(product.name);
            const coaUrl = getFirstCoa(product);
            const startingPrice = getStartingPrice(product);

            return (
              <motion.div
                key={product.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.07, duration: 0.45 }}
                className="group bg-carbon border border-slate hover:border-accent transition-all duration-200 hover:-translate-y-1 flex flex-col overflow-hidden"
              >
                {/* Product image */}
                <div className="relative aspect-square bg-white border-b border-slate overflow-hidden">
                  <Image
                    src={getProductImage(product)}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                <div className="p-4 flex flex-col gap-3 flex-1">
                  <div>
                    <h3 className="font-sans font-bold text-paper text-sm leading-tight">{product.name}</h3>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {product.strengths.map((s) => (
                        <span key={s} className="bg-slate text-accent font-mono text-[10px] px-2 py-0.5 tracking-wide">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="font-mono text-accent text-sm font-semibold">{startingPrice}</p>

                  <div className="flex flex-col gap-2 mt-auto pt-2 border-t border-slate">
                    <Link
                      href={`/shop/${slug}`}
                      className="w-full text-center bg-accent text-obsidian font-mono font-semibold text-[10px] tracking-wider uppercase py-2 hover:bg-accent/80 transition-colors"
                    >
                      View Product
                    </Link>
                    {coaUrl && (
                      <a
                        href={coaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full text-center border border-accent text-accent font-mono text-[10px] tracking-wider uppercase py-2 hover:bg-accent/10 transition-colors"
                      >
                        View COA
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 font-mono text-xs tracking-[0.2em] uppercase text-accent border border-accent px-8 h-11 hover:bg-accent/10 transition-colors"
          >
            View All Research Compounds →
          </Link>
        </div>
      </div>
    </section>
  );
}
