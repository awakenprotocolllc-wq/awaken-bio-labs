"use client";

import { useState } from "react";
import Link from "next/link";
import { type Product, getPriceForStrength, isOrderable, getCoaForStrength, slugify } from "@/lib/products";
import { useCart } from "@/lib/cart";
import RestockNotify from "@/components/RestockNotify";

export default function ProductOrderSection({
  product,
  outOfStock = false,
}: {
  product: Product;
  outOfStock?: boolean;
}) {
  const [selectedStrength, setSelectedStrength] = useState(product.strengths[0]);
  const [added, setAdded] = useState(false);
  const { addItem, openDrawer } = useCart();

  const price = getPriceForStrength(product, selectedStrength);
  const canOrder = isOrderable(product, selectedStrength);
  const coaUrl = getCoaForStrength(product, selectedStrength);

  const contactUrl = `mailto:support@awakenbiolabs.com?subject=${encodeURIComponent(
    `Order Inquiry: ${product.name}`
  )}&body=${encodeURIComponent(
    `Hi, I'd like to inquire about ordering ${product.name} (${selectedStrength}). Please let me know pricing and availability.`
  )}`;

  function handleAddToCart() {
    addItem({
      product: product.name,
      strength: selectedStrength,
      price: price!,
    });
    // Flash confirmation, then open drawer
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
    openDrawer();
  }

  return (
    <>
      {/* Strength selector */}
      <div className="mt-8">
        <p className="font-mono text-bone text-xs tracking-wider uppercase mb-3">
          Select Strength
        </p>
        <div className="flex flex-wrap gap-2">
          {product.strengths.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedStrength(s)}
              className={`font-mono text-sm px-4 h-11 min-h-[44px] border transition-colors ${
                s === selectedStrength
                  ? "border-accent text-accent bg-carbon"
                  : "border-slate text-bone hover:border-accent hover:text-accent"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Price display */}
      <div className="flex items-baseline gap-4 mt-4">
        <span className="font-mono text-accent text-2xl font-semibold">
          {price ?? "—"}
        </span>
        <span className="font-mono text-bone text-xs tracking-wider">
          IN-VITRO RESEARCH USE ONLY
        </span>
      </div>

      {/* Out of stock — notice + restock notification signup */}
      {outOfStock && (
        <div className="mt-6 space-y-4">
          <div className="bg-carbon border border-red-500/40 px-5 py-4 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
            <p className="font-mono text-red-400 text-xs tracking-[0.15em] uppercase">
              Currently Out of Stock
            </p>
          </div>
          <RestockNotify slug={slugify(product.name)} productName={product.name} />
        </div>
      )}

      {/* CTA buttons */}
      <div className="mt-6 grid grid-cols-1 xs:grid-cols-2 gap-3">
        {outOfStock ? (
          <span className="bg-slate/60 text-bone/50 font-semibold h-12 min-h-[44px] flex items-center justify-center cursor-not-allowed select-none">
            Out of Stock
          </span>
        ) : canOrder ? (
          <button
            onClick={handleAddToCart}
            className={`h-12 min-h-[44px] flex items-center justify-center font-semibold transition-colors ${
              added
                ? "bg-green-500/20 border border-green-500/60 text-green-400"
                : "bg-accent text-obsidian hover:bg-accent/80"
            }`}
          >
            {added ? "✓ Added to Cart" : "Add to Cart"}
          </button>
        ) : (
          <a
            href={contactUrl}
            className="bg-accent text-obsidian font-semibold h-12 min-h-[44px] flex items-center justify-center hover:bg-accent/80 transition-colors"
          >
            Contact to Order
          </a>
        )}
        {coaUrl && coaUrl !== "pending" ? (
          <a
            href={coaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-accent text-accent font-semibold h-12 min-h-[44px] flex items-center justify-center hover:bg-accent/10 transition-colors"
          >
            View COA ↗
          </a>
        ) : coaUrl === "pending" ? (
          <span className="border border-slate text-bone font-semibold h-12 min-h-[44px] flex items-center justify-center gap-2 cursor-default">
            <span className="w-1.5 h-1.5 rounded-full bg-accent/60 animate-pulse" />
            COA Coming Soon
          </span>
        ) : (
          <Link
            href="/coas"
            className="border border-slate text-bone font-semibold h-12 min-h-[44px] flex items-center justify-center hover:border-accent hover:text-accent transition-colors"
          >
            View COAs
          </Link>
        )}
      </div>
    </>
  );
}
