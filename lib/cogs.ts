import type { OrderItem } from "@/lib/db";

// ---------------------------------------------------------------------------
// COGS — Cost of Goods Sold
// Internal only. Never exposed to customers or affiliates.
// Source: 1stPharma™ Private Label Pricing
//
// Key format: "Product Name|strength"  (must match exactly what's stored on orders)
// ---------------------------------------------------------------------------

const UNIT_COSTS: Record<string, number> = {
  // GH Axis
  "CJC-1295 (with DAC)|5mg":        23.75,
  "CJC-1295 (without DAC)|10mg":    21.00,
  "Ipamorelin|10mg":                 12.25,
  "GHRP-6 Acetate|10mg":             8.75,
  "Sermorelin Acetate|10mg":         16.75,
  "AOD-9604|5mg":                    15.75,
  "IGF-1 LR3|1mg":                   29.75,
  "IGF-DES|1mg":                      0,    // not in supplier list — update when available

  // Metabolic
  "GLP3-R (Retatrutide)|10mg":       15.75,
  "GLP3-R (Retatrutide)|30mg":       34.25,
  "5-Amino-1MQ|5mg":                  7.00,

  // Repair & Recovery
  "BPC-157|10mg":                     9.75,
  "TB-500|10mg":                     19.25,
  "GHK-Cu|50mg":                      5.00,
  "GHK-Cu|100mg":                     9.00,
  "Snap-8|10mg":                      8.00,
  "SLU-PP-322|5mg":                  16.75,
  "KPV (Lysine-Proline-Valine)|10mg": 12.25,
  "PNC-27|10mg":                     27.25,

  // Cognitive
  "Selank|10mg":                      8.50,
  "Semax|10mg":                       8.50,
  "DSIP|15mg":                       15.00,
  "Pinealon|20mg":                   17.50,
  "Oxytocin|2mg":                     5.00,

  // Longevity
  "Epithalon|10mg":                   9.00,
  "MOTS-C|10mg":                      9.75,
  "MOTS-C|40mg":                     29.75,
  "SS-31|50mg":                      45.50,
  "FOX-04|10mg":                     47.25,
  "NAD+|500mg":                      12.25,
  "Glutathione|1500mg":               0,    // not in supplier list — update when available

  // Sexual Health
  "PT-141|10mg":                      8.75,
  "Kisspeptin-10|10mg":              15.00,

  // Blends
  "BPC Blend|70mg":                   0,    // not in supplier list — update when available
  "Wolverine Blend|20mg":            29.75,
  "KLOW|80mg":                       33.25,

  // Supplies
  "BAC Water|10ml":                   0,    // update when available
  "BAC Water 2|10mg":                19.25,
};

/** Cost per single unit of a product+strength. Returns 0 if not configured. */
export function getUnitCost(product: string, strength: string): number {
  return UNIT_COSTS[`${product}|${strength}`] ?? 0;
}

/** Total COGS for a list of order items. */
export function calcOrderCogs(items: OrderItem[]): number {
  return items.reduce(
    (sum, item) => sum + getUnitCost(item.product, item.strength) * item.qty,
    0
  );
}

/** Format a dollar amount consistently. */
export function fmtDollars(n: number): string {
  return `$${n.toFixed(2)}`;
}
