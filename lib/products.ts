export type Product = {
  name: string;
  strengths: string[];
  price: string | null; // null = price not yet set
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
  { name: "CJC-1295 (with DAC)",    strengths: ["5mg"],        price: "$23.75",          category: "GH Axis" },
  { name: "CJC-1295 (without DAC)", strengths: ["10mg"],       price: "$21.00",          category: "GH Axis" },
  { name: "Ipamorelin",             strengths: ["10mg"],       price: "$12.25",          category: "GH Axis" },
  { name: "GHRP-6 Acetate",         strengths: ["10mg"],       price: "$8.75",           category: "GH Axis" },
  { name: "Sermorelin Acetate",     strengths: ["10mg"],       price: null,              category: "GH Axis" },
  { name: "AOD-9604",               strengths: ["5mg"],        price: "$15.75",          category: "GH Axis" },
  { name: "IGF-1 LR3",              strengths: ["1mg"],        price: "$29.75",          category: "GH Axis" },
  { name: "IGF-DES",                strengths: ["1mg"],        price: null,              category: "GH Axis" },

  // Metabolic
  { name: "GLP3-R (Retatrutide)",   strengths: ["10mg", "30mg"], price: "$15.75 – $34.25", coa: "pending", category: "Metabolic" },

  // Repair & Recovery
  { name: "BPC-157",                strengths: ["10mg"],       price: "$9.75",           coa: "pending", category: "Repair & Recovery" },
  { name: "TB-500",                 strengths: ["10mg"],       price: "$19.25",          coa: "pending", category: "Repair & Recovery" },
  { name: "GHK-Cu",                 strengths: ["100mg"],      price: "$9.00",           coa: "pending", category: "Repair & Recovery" },
  { name: "Snap-8",                 strengths: ["10mg"],       price: "$8.00",           category: "Repair & Recovery" },
  { name: "SLU-PP-322",             strengths: ["5mg"],        price: "$16.75",          category: "Repair & Recovery" },
  { name: "KPV (Lysine-Proline-Valine)", strengths: ["10mg"], price: "$12.25",          category: "Repair & Recovery" },
  { name: "PNC-27",                 strengths: ["10mg"],       price: "$27.25",          category: "Repair & Recovery" },

  // Cognitive
  { name: "Selank",                 strengths: ["10mg"],       price: "$8.50",           category: "Cognitive" },
  { name: "Semax",                  strengths: ["10mg"],       price: "$8.50",           category: "Cognitive" },
  { name: "DSIP",                   strengths: ["15mg"],       price: "$15.00",          category: "Cognitive" },
  { name: "Pinealon",               strengths: ["20mg"],       price: "$17.50",          category: "Cognitive" },
  { name: "Oxytocin",               strengths: ["2mg"],        price: "$5.00",           category: "Cognitive" },

  // Longevity
  { name: "Epithalon",              strengths: ["10mg"],       price: "$9.00",           category: "Longevity" },
  { name: "MOTS-C",                 strengths: ["10mg"],       price: "$9.75",           coa: "pending", category: "Longevity" },
  { name: "SS-31",                  strengths: ["50mg"],       price: "$45.50",          category: "Longevity" },
  { name: "FOX-04",                 strengths: ["10mg"],       price: "$47.25",          category: "Longevity" },
  { name: "NAD+",                   strengths: ["500mg"],      price: "$12.25",          coa: "pending", category: "Longevity" },
  { name: "Glutathione",            strengths: ["1500mg"],     price: null,              category: "Longevity" },

  // Sexual Health
  { name: "PT-141",                 strengths: ["10mg"],       price: "$8.75",           category: "Sexual Health" },
  { name: "Kisspeptin-10",          strengths: ["10mg"],       price: "$15.00",          category: "Sexual Health" },

  // Blends
  { name: "BPC Blend",              strengths: ["70mg"],       price: "$28.00",          category: "Blends" },
  { name: "Wolverine",              strengths: ["20mg"],       price: "$29.75",          coa: "pending", category: "Blends" },
  { name: "KLOW",                   strengths: ["80mg"],       price: "$33.25",          category: "Blends" },

  // Supplies
  { name: "BAC Water",              strengths: ["10ml"],       price: null,              category: "Supplies" },
];
