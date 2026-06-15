"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { products, getProductImage, slugify } from "@/lib/products";
import { useCart } from "@/lib/cart";

// ---------------------------------------------------------------------------
// Pairing map — keyed by cart product name, values are ordered suggestions.
// Based on common research category co-purchasing patterns.
// No pairing language is exposed in the UI.
// ---------------------------------------------------------------------------
const PAIRS: Record<string, string[]> = {
  // Regeneration stacks
  "BPC-157":          ["TB-500", "GHK-Cu", "GLOW"],
  "TB-500":           ["BPC-157", "GHK-Cu", "GLOW"],
  "GHK-Cu":           ["BPC-157", "TB-500", "GLOW"],
  "GLOW":             ["BPC-157", "TB-500", "Wolverine Blend"],
  "Wolverine Blend":  ["GHK-Cu", "BPC-157", "Epithalon"],
  "KPV (Lysine-Proline-Valine)": ["BPC-157", "TB-500", "GHK-Cu"],
  "Snap-8":           ["GHK-Cu", "BPC-157", "PNC-27"],
  "SLU-PP-322":       ["BPC-157", "TB-500", "NAD+"],
  "PNC-27":           ["BPC-157", "GHK-Cu", "TB-500"],

  // GH axis stacks
  "CJC-1295 (with DAC)":    ["Ipamorelin", "IGF-1 LR3", "GHRP-6 Acetate"],
  "CJC-1295 (without DAC)": ["Ipamorelin", "GHRP-6 Acetate", "Sermorelin Acetate"],
  "Ipamorelin":             ["CJC-1295 (with DAC)", "GHRP-6 Acetate", "IGF-1 LR3"],
  "GHRP-6 Acetate":         ["CJC-1295 (with DAC)", "Ipamorelin", "Sermorelin Acetate"],
  "Sermorelin Acetate":     ["Ipamorelin", "CJC-1295 (without DAC)", "IGF-1 LR3"],
  "AOD-9604":               ["CJC-1295 (with DAC)", "Ipamorelin", "GHRP-6 Acetate"],
  "IGF-1 LR3":              ["CJC-1295 (with DAC)", "Ipamorelin", "IGF-DES"],
  "IGF-DES":                ["IGF-1 LR3", "CJC-1295 (with DAC)", "Ipamorelin"],

  // GLP / metabolic research
  "GLP3-R (Retatrutide)": ["NAD+", "MOTS-C", "5-Amino-1MQ"],
  "5-Amino-1MQ":          ["NAD+", "GLP3-R (Retatrutide)", "MOTS-C"],

  // Defence / longevity research
  "NAD+":        ["MOTS-C", "Glutathione", "Epithalon"],
  "MOTS-C":      ["NAD+", "Epithalon", "SS-31"],
  "Epithalon":   ["MOTS-C", "NAD+", "FOX-04"],
  "SS-31":       ["MOTS-C", "NAD+", "Epithalon"],
  "Glutathione": ["NAD+", "MOTS-C", "Epithalon"],
  "FOX-04":      ["Epithalon", "MOTS-C", "SS-31"],

  // Neuro research
  "Selank":    ["Semax", "DSIP", "Pinealon"],
  "Semax":     ["Selank", "DSIP", "Oxytocin"],
  "DSIP":      ["Selank", "Semax", "Pinealon"],
  "Pinealon":  ["DSIP", "Selank", "Oxytocin"],
  "Oxytocin":  ["Selank", "Semax", "Kisspeptin-10"],

  // All Other
  "PT-141":        ["Kisspeptin-10", "Oxytocin", "Selank"],
  "Kisspeptin-10": ["PT-141", "Oxytocin", "Selank"],
  "KLOW":          ["GLOW", "Wolverine Blend", "NAD+"],
};

// Fallback order when no pairing data exists for a cart item
const BESTSELLERS = [
  "BPC-157", "TB-500", "NAD+", "MOTS-C", "GLOW",
  "CJC-1295 (with DAC)", "Ipamorelin", "Selank",
];

// Resolve the best single-strength + price to show for a product.
// Returns null when no directly-addable price exists.
function resolveAddable(
  product: (typeof products)[number]
): { strength: string; price: string } | null {
  // Try each strength in order; pick first one with a concrete dollar price
  for (const s of product.strengths) {
    const p = product.priceMap?.[s] ?? product.price;
    if (p && p.startsWith("$") && !p.includes("–")) {
      return { strength: s, price: p };
    }
  }
  return null;
}

export default function CheckoutUpsell() {
  const { items, addItem } = useCart();

  const upsellItems = useMemo(() => {
    const cartNames = new Set(items.map((i) => i.product));
    // Always exclude BAC Water variants — they have their own dedicated upsell
    cartNames.add("BAC Water");
    cartNames.add("BAC Water 2");

    const seen = new Set<string>();
    const suggestions: string[] = [];

    // 1. Collect paired suggestions for every item in cart
    for (const item of items) {
      for (const name of PAIRS[item.product] ?? []) {
        if (!cartNames.has(name) && !seen.has(name)) {
          seen.add(name);
          suggestions.push(name);
        }
      }
    }

    // 2. Back-fill from bestsellers if we have fewer than 3
    if (suggestions.length < 3) {
      for (const name of BESTSELLERS) {
        if (!cartNames.has(name) && !seen.has(name)) {
          seen.add(name);
          suggestions.push(name);
        }
        if (suggestions.length >= 3) break;
      }
    }

    // 3. Map names → product objects, limit to 3
    return suggestions
      .slice(0, 3)
      .map((name) => products.find((p) => p.name === name))
      .filter((p): p is (typeof products)[number] => !!p);
  }, [items]);

  if (items.length === 0 || upsellItems.length === 0) return null;

  return (
    <div className="mt-3 mb-1">
      <p className="font-mono text-accent text-[10px] tracking-[0.2em] uppercase mb-2">— Featured —</p>
      <div className="space-y-2">
        {upsellItems.map((product) => {
          const addable = resolveAddable(product);
          const slug = slugify(product.name);

          return (
            <div
              key={product.name}
              className="flex items-center gap-3 bg-carbon border border-slate/60 hover:border-accent/40 transition-colors p-3"
            >
              {/* Thumbnail */}
              <div className="w-10 h-10 bg-white border border-slate shrink-0 overflow-hidden relative">
                <Image
                  src={getProductImage(product)}
                  alt={product.name}
                  fill
                  sizes="40px"
                  className="object-contain p-1"
                />
              </div>

              {/* Name + strength */}
              <div className="flex-1 min-w-0">
                <p className="font-sans font-semibold text-paper text-xs leading-tight truncate">
                  {product.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {(addable ? [addable.strength] : product.strengths.slice(0, 2)).map((s) => (
                    <span key={s} className="font-mono text-[9px] text-accent bg-slate px-1.5 py-0.5">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Price */}
              <span className="font-mono text-accent text-xs font-semibold shrink-0">
                {addable ? addable.price : product.price ?? "—"}
              </span>

              {/* CTA */}
              {addable ? (
                <button
                  type="button"
                  onClick={() =>
                    addItem({
                      product: product.name,
                      strength: addable.strength,
                      price: addable.price,
                    })
                  }
                  className="font-mono text-[10px] text-obsidian bg-accent px-3 py-1.5 hover:bg-accent/80 transition-colors tracking-wider shrink-0 min-h-[32px]"
                >
                  Add +
                </button>
              ) : (
                <Link
                  href={`/shop/${slug}`}
                  className="font-mono text-[10px] text-accent border border-accent px-3 py-1.5 hover:bg-accent/10 transition-colors tracking-wider shrink-0 min-h-[32px] flex items-center"
                >
                  View →
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
