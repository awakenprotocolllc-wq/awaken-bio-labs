"use client";

import { useState } from "react";
import Link from "next/link";
import { type Product, getPriceForStrength, isOrderable } from "@/lib/products";
import { useCart } from "@/lib/cart";

export default function ProductOrderSection({ product }: { product: Product }) {
  const [selectedStrength, setSelectedStrength] = useState(product.strengths[0]);
  const [added, setAdded] = useState(false);
  const { addItem, openDrawer } = useCart();

  const price = getPriceForStrength(product, selectedStrength);
  const canOrder = isOrderable(product, selectedStrength);

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

      {/* CTA buttons */}
      <div className="mt-6 grid grid-cols-1 xs:grid-cols-2 gap-3">
        {canOrder ? (
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
        <Link
          href="/coas"
          className="border border-accent text-accent font-semibold h-12 min-h-[44px] flex items-center justify-center hover:bg-accent/10 transition-colors"
        >
          View COA
        </Link>
      </div>
    </>
  );
}
