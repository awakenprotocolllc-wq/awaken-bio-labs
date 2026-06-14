export type Product = {
  name: string;
  /** Short composition or tagline shown on cards and detail pages */
  subtitle?: string;
  strengths: string[];
  price: string | null; // null = price not set; "Contact Seller" = no online checkout
  /** Per-strength prices for multi-strength products */
  priceMap?: Record<string, string>;
  coa?: "pending" | string; // "pending" = coming soon, string = URL to PDF
  /** Per-strength COA overrides — takes priority over coa for a given strength */
  coaMap?: Record<string, string>;
  category:
    | "GHRH/GHRP"
    | "Regeneration"
    | "GLP3-R"
    | "Neuro Research"
    | "Defence Peptide Research"
    | "All Other";
};

/** Returns the COA URL for a given strength, or falls back to product.coa */
export function getCoaForStrength(product: Product, strength?: string): string | "pending" | undefined {
  if (strength && product.coaMap?.[strength]) return product.coaMap[strength];
  return product.coa;
}

/** Returns the price for a given strength, falling back to product.price */
export function getPriceForStrength(product: Product, strength: string): string | null {
  return product.priceMap?.[strength] ?? product.price ?? null;
}

/** Returns true if the product can be ordered online (has a fixed dollar price) */
export function isOrderable(product: Product, strength?: string): boolean {
  const p = strength ? getPriceForStrength(product, strength) : product.price;
  return !!p && p !== "Contact Seller" && p.startsWith("$") && !p.includes("–");
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\+/g, "-plus-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => slugify(p.name) === slug);
}

export function getProductImage(product: Product): string {
  return `/products/${slugify(product.name)}.png`;
}

export const categories = [
  "All",
  "Regeneration",
  "Neuro Research",
  "GLP3-R",
  "GHRH/GHRP",
  "Defence Peptide Research",
  "All Other",
] as const;

export const products: Product[] = [
  // GHRH/GHRP (formerly GH Axis)
  { name: "CJC-1295 (with DAC)",    strengths: ["5mg"],        price: "$65.00",          category: "GHRH/GHRP" },
  { name: "CJC-1295 (without DAC)", strengths: ["10mg"],       price: "$55.00",          category: "GHRH/GHRP" },
  { name: "Ipamorelin",             strengths: ["10mg"],       price: "$60.00",          category: "GHRH/GHRP" },
  { name: "GHRP-6 Acetate",         strengths: ["10mg"],       price: "$45.00",          category: "GHRH/GHRP" },
  { name: "Sermorelin Acetate",     strengths: ["10mg"],       price: "$75.00",          category: "GHRH/GHRP" },
  { name: "AOD-9604",               strengths: ["5mg"],        price: "$50.00",          category: "GHRH/GHRP" },
  { name: "IGF-1 LR3",              strengths: ["1mg"],        price: "$65.00",          category: "GHRH/GHRP" },
  { name: "IGF-DES",                strengths: ["1mg"],        price: "$74.50",          category: "GHRH/GHRP" },

  // GLP-1(R) (formerly Metabolic)
  {
    name: "GLP3-R (Retatrutide)",
    strengths: ["10mg", "30mg"],
    price: "$102.00 – $261.00",
    priceMap: { "10mg": "$102.00", "30mg": "$261.00" },
    coaMap: { "10mg": "/coas/retatrutide-10mg.pdf", "30mg": "/coas/retatrutide-30mg.pdf" },
    category: "GLP3-R",
  },
  { name: "5-Amino-1MQ",            strengths: ["5mg"],        price: "$70.00",          category: "GLP3-R" },

  // Regeneration (formerly Repair & Recovery)
  { name: "BPC-157",                strengths: ["10mg"],       price: "$52.50",          coa: "/coas/bpc-157.pdf",  category: "Regeneration" },
  { name: "TB-500",                 strengths: ["10mg"],       price: "$57.00",          coa: "/coas/tb-500.pdf",   category: "Regeneration" },
  {
    name: "GHK-Cu",
    strengths: ["50mg", "100mg"],
    price: "$45.00 – $61.50",
    priceMap: { "50mg": "$45.00", "100mg": "$61.50" },
    coa: "/coas/ghk-cu.pdf",
    category: "Regeneration",
  },
  { name: "Snap-8",                 strengths: ["10mg"],       price: "$35.00",          category: "Regeneration" },
  { name: "SLU-PP-322",             strengths: ["5mg"],        price: "$65.00",          category: "Regeneration" },
  { name: "KPV (Lysine-Proline-Valine)", strengths: ["10mg"], price: "$75.00",          category: "Regeneration" },
  { name: "PNC-27",                 strengths: ["10mg"],       price: "$150.00",         category: "Regeneration" },

  // Neuro Research (formerly Cognitive)
  { name: "Selank",                 strengths: ["10mg"],       price: "$48.50",          category: "Neuro Research" },
  { name: "Semax",                  strengths: ["10mg"],       price: "$48.50",          category: "Neuro Research" },
  { name: "DSIP",                   strengths: ["15mg"],       price: "$70.00",          category: "Neuro Research" },
  { name: "Pinealon",               strengths: ["20mg"],       price: "$65.00",          category: "Neuro Research" },
  { name: "Oxytocin",               strengths: ["2mg"],        price: "$30.00",          category: "Neuro Research" },

  // Defence Peptide Research (formerly Longevity)
  { name: "Epithalon",              strengths: ["10mg"],       price: "$40.00",          category: "Defence Peptide Research" },
  {
    name: "MOTS-C",
    strengths: ["10mg", "40mg"],
    price: "$48.50 – $120.00",
    priceMap: { "10mg": "$48.50", "40mg": "$120.00" },
    coaMap: { "10mg": "/coas/mots-c-10mg.pdf" },
    category: "Defence Peptide Research",
  },
  { name: "SS-31",                  strengths: ["50mg"],       price: "$150.00",         category: "Defence Peptide Research" },
  { name: "FOX-04",                 strengths: ["10mg"],       price: "$217.50",         category: "Defence Peptide Research" },
  { name: "NAD+",                   strengths: ["500mg"],      price: "$82.00",          coa: "/coas/nad-plus.pdf", category: "Defence Peptide Research" },
  { name: "Glutathione",            strengths: ["1500mg"],     price: "$84.00",          category: "Defence Peptide Research" },

  // All Other (formerly Sexual Health, Blends, Supplies)
  { name: "PT-141",                 strengths: ["10mg"],       price: "$36.00",          category: "All Other" },
  { name: "Kisspeptin-10",          strengths: ["10mg"],       price: "$75.00",          category: "All Other" },
  { name: "Glow",                    subtitle: "BPC 10MG + GHK-Cu 50MG + TB-500 10MG", strengths: ["70mg"], price: "$110.50", category: "All Other" },
  { name: "Wolverine Blend",        subtitle: "TB-500 + BPC-157", strengths: ["20mg"], price: "$135.00", coa: "/coas/wolverine-blend.pdf", category: "All Other" },
  { name: "KLOW",                   strengths: ["80mg"],       price: "$145.00",         category: "All Other" },
  { name: "BAC Water",              strengths: ["10ml"],       price: "$9.50",           category: "All Other" },
  { name: "BAC Water 2",            strengths: ["10mg"],       price: "$106.00",         category: "All Other" },
];
