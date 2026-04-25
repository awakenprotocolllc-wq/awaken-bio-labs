export type Product = {
  name: string;
  strengths: string[];
  category:
    | "GH Axis"
    | "Repair & Recovery"
    | "Metabolic"
    | "Longevity"
    | "Cognitive"
    | "Sexual Health"
    | "Blends";
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
] as const;

export const products: Product[] = [
  { name: "5-Amino-1MQ", strengths: ["5mg", "50mg"], category: "Metabolic" },
  { name: "AHK-CU", strengths: ["100mg"], category: "Repair & Recovery" },
  { name: "AOD-9604", strengths: ["5mg"], category: "Metabolic" },
  { name: "ARA-290", strengths: ["10mg"], category: "Repair & Recovery" },
  { name: "BPC-157", strengths: ["5mg", "10mg"], category: "Repair & Recovery" },
  { name: "Ciagrilide", strengths: ["10mg"], category: "Metabolic" },
  { name: "CJC-1295 (with DAC)", strengths: ["5mg"], category: "GH Axis" },
  { name: "CJC-1295 (without DAC)", strengths: ["10mg"], category: "GH Axis" },
  { name: "CJC-1295 + Ipamorelin", strengths: ["10mg"], category: "GH Axis" },
  { name: "DSIP", strengths: ["15mg"], category: "Cognitive" },
  { name: "Epithalon", strengths: ["10mg", "40mg"], category: "Longevity" },
  { name: "FOX-04", strengths: ["10mg"], category: "Longevity" },
  { name: "GHK-CU", strengths: ["50mg", "100mg"], category: "Repair & Recovery" },
  { name: "GHRP-6", strengths: ["10mg"], category: "GH Axis" },
  { name: "GLOW", strengths: ["70mg"], category: "Blends" },
  { name: "HCG", strengths: ["10,000 IU"], category: "GH Axis" },
  { name: "HGH-Frag 176-191", strengths: ["5mg"], category: "GH Axis" },
  { name: "Hexarelin Acetate", strengths: ["5mg"], category: "GH Axis" },
  { name: "IGF-1 LR3", strengths: ["1mg"], category: "GH Axis" },
  { name: "Ipamorelin", strengths: ["5mg", "10mg"], category: "GH Axis" },
  { name: "Kisspeptin", strengths: ["10mg"], category: "Sexual Health" },
  { name: "KLOW", strengths: ["80mg"], category: "Blends" },
  { name: "LPV", strengths: ["5mg"], category: "Repair & Recovery" },
  { name: "LL-37", strengths: ["5mg"], category: "Repair & Recovery" },
  { name: "Melanatan-1", strengths: ["10mg"], category: "Sexual Health" },
  { name: "Melanatan-2", strengths: ["10mg"], category: "Sexual Health" },
  { name: "MOTS-C", strengths: ["10mg", "40mg"], category: "Longevity" },
  { name: "NAD+", strengths: ["500mg", "1,000mg"], category: "Longevity" },
  { name: "Oxytocin", strengths: ["2mg"], category: "Cognitive" },
  { name: "PEG-MGF", strengths: ["2mg"], category: "GH Axis" },
  { name: "Pinealon", strengths: ["20mg"], category: "Cognitive" },
  { name: "PNC-27", strengths: ["10mg"], category: "Repair & Recovery" },
  { name: "PT-141", strengths: ["10mg"], category: "Sexual Health" },
  { name: "Retatrutide", strengths: ["5mg", "10mg", "20mg", "30mg"], category: "Metabolic" },
  { name: "Selank", strengths: ["11mg"], category: "Cognitive" },
  { name: "Semax", strengths: ["5mg", "10mg"], category: "Cognitive" },
  { name: "Semaglutide Acetate", strengths: ["10mg"], category: "Metabolic" },
  { name: "SLIP-322", strengths: ["5mg"], category: "Repair & Recovery" },
  { name: "Snap-8", strengths: ["10mg"], category: "Repair & Recovery" },
  { name: "SS-31", strengths: ["10mg", "50mg"], category: "Longevity" },
  { name: "TB-500", strengths: ["10mg"], category: "Repair & Recovery" },
  { name: "Tesamorelin", strengths: ["5mg", "10mg"], category: "GH Axis" },
  { name: "Thymalin", strengths: ["10mg"], category: "Longevity" },
  { name: "Thymosin Alpha-1", strengths: ["10mg"], category: "Longevity" },
  { name: "Tirzepatide", strengths: ["10mg", "30mg", "60mg"], category: "Metabolic" },
  { name: "VIP", strengths: ["10mg"], category: "Repair & Recovery" },
  { name: "Wolverine Blend (TB-500 + BPC-157)", strengths: ["20mg"], category: "Blends" },
];
