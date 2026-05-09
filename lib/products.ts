export type Product = {
  name: string;
  strengths: string[];
  price: string | null; // null = price not set; "Contact Seller" = no online checkout
  /** Per-strength prices for multi-strength products */
  priceMap?: Record<string, string>;
  coa?: "pending" | string; // "pending" = coming soon, string = URL to PDF
  category:
    | "GH Axis"
    | "Repair & Recovery"
    | "Metabolic"
    | "Longevity"
    | "Cognitive"
    | "Sexual Health"
    | "Blends"
    | "Supplies";
};

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
  "GH Axis",
  "Repair & Recovery",
  "Metabolic",
  "Longevity",
  "Cognitive",
  "Sexual Health",
  "Blends",
  "Supplies",
] as const;

export const products: Product[] = [
  // GH Axis
  { name: "CJC-1295 (with DAC)",    strengths: ["5mg"],        price: "$65.00",          category: "GH Axis" },
  { name: "CJC-1295 (without DAC)", strengths: ["10mg"],       price: "$55.00",          category: "GH Axis" },
  { name: "Ipamorelin",             strengths: ["10mg"],       price: "$60.00",          category: "GH Axis" },
  { name: "GHRP-6 Acetate",         strengths: ["10mg"],       price: "$45.00",          category: "GH Axis" },
  { name: "Sermorelin Acetate",     strengths: ["10mg"],       price: "Contact Seller",  category: "GH Axis" },
  { name: "AOD-9604",               strengths: ["5mg"],        price: "$50.00",          category: "GH Axis" },
  { name: "IGF-1 LR3",              strengths: ["1mg"],        price: "$65.00",          category: "GH Axis" },
  { name: "IGF-DES",                strengths: ["1mg"],        price: "$74.50",          category: "GH Axis" },

  // Metabolic
  {
    name: "GLP3-R (Retatrutide)",
    strengths: ["10mg", "30mg"],
    price: "$102.00 – $261.00",
    priceMap: { "10mg": "$102.00", "30mg": "$261.00" },
    coa: "pending",
    category: "Metabolic",
  },
  { name: "5-Amino-1MQ",            strengths: ["5mg"],        price: "$70.00",          category: "Metabolic" },

  // Repair & Recovery
  { name: "BPC-157",                strengths: ["10mg"],       price: "$52.50",          coa: "pending", category: "Repair & Recovery" },
  { name: "TB-500",                 strengths: ["10mg"],       price: "$57.00",          coa: "pending", category: "Repair & Recovery" },
  {
    name: "GHK-Cu",
    strengths: ["50mg", "100mg"],
    price: "$45.00 – $61.50",
    priceMap: { "50mg": "$45.00", "100mg": "$61.50" },
    coa: "pending",
    category: "Repair & Recovery",
  },
  { name: "Snap-8",                 strengths: ["10mg"],       price: "$35.00",          category: "Repair & Recovery" },
  { name: "SLU-PP-322",             strengths: ["5mg"],        price: "$65.00",          category: "Repair & Recovery" },
  { name: "KPV (Lysine-Proline-Valine)", strengths: ["10mg"], price: "Contact Seller",  category: "Repair & Recovery" },
  { name: "PNC-27",                 strengths: ["10mg"],       price: "$150.00",         category: "Repair & Recovery" },

  // Cognitive
  { name: "Selank",                 strengths: ["10mg"],       price: "$48.50",          category: "Cognitive" },
  { name: "Semax",                  strengths: ["10mg"],       price: "$48.50",          category: "Cognitive" },
  { name: "DSIP",                   strengths: ["15mg"],       price: "$70.00",          category: "Cognitive" },
  { name: "Pinealon",               strengths: ["20mg"],       price: "$65.00",          category: "Cognitive" },
  { name: "Oxytocin",               strengths: ["2mg"],        price: "$30.00",          category: "Cognitive" },

  // Longevity
  { name: "Epithalon",              strengths: ["10mg"],       price: "$40.00",          category: "Longevity" },
  {
    name: "MOTS-C",
    strengths: ["10mg", "40mg"],
    price: "$48.50 – $120.00",
    priceMap: { "10mg": "$48.50", "40mg": "$120.00" },
    coa: "pending",
    category: "Longevity",
  },
  { name: "SS-31",                  strengths: ["50mg"],       price: "$150.00",         category: "Longevity" },
  { name: "FOX-04",                 strengths: ["10mg"],       price: "$217.50",         category: "Longevity" },
  { name: "NAD+",                   strengths: ["500mg"],      price: "$82.00",          coa: "pending", category: "Longevity" },
  { name: "Glutathione",            strengths: ["1500mg"],     price: "$84.00",          category: "Longevity" },

  // Sexual Health
  { name: "PT-141",                 strengths: ["10mg"],       price: "$36.00",          category: "Sexual Health" },
  { name: "Kisspeptin-10",          strengths: ["10mg"],       price: "$75.00",          category: "Sexual Health" },

  // Blends
  { name: "BPC Blend",              strengths: ["70mg"],       price: "$110.50",         category: "Blends" },
  { name: "Wolverine Blend",        strengths: ["20mg"],       price: "Contact Seller",  coa: "pending", category: "Blends" },
  { name: "KLOW",                   strengths: ["80mg"],       price: "$145.00",         category: "Blends" },

  // Supplies
  { name: "BAC Water",              strengths: ["10ml"],       price: "$9.50",           category: "Supplies" },
];
