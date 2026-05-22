import type { OrderItem } from "@/lib/db";

// ---------------------------------------------------------------------------
// COGS — Cost of Goods Sold
// Internal only. Never exposed to customers or affiliates.
//
// Key format: "Product Name|strength"  (must match exactly what's stored on orders)
// Example:    "BPC-157|10mg": 18.00
//
// Leave at 0 until you have supplier invoices to reference.
// ---------------------------------------------------------------------------

const UNIT_COSTS: Record<string, number> = {
  // GH Axis
  "CJC-1295 (with DAC)|5mg":        0,
  "CJC-1295 (without DAC)|10mg":    0,
  "Ipamorelin|10mg":                 0,
  "GHRP-6 Acetate|10mg":            0,
  "Sermorelin Acetate|10mg":         0,
  "AOD-9604|5mg":                    0,
  "IGF-1 LR3|1mg":                   0,
  "IGF-DES|1mg":                     0,

  // Metabolic
  "GLP3-R (Retatrutide)|10mg":       0,
  "GLP3-R (Retatrutide)|30mg":       0,
  "5-Amino-1MQ|5mg":                 0,

  // Repair & Recovery
  "BPC-157|10mg":                    0,
  "TB-500|10mg":                     0,
  "GHK-Cu|50mg":                     0,
  "GHK-Cu|100mg":                    0,
  "Snap-8|10mg":                     0,
  "SLU-PP-322|5mg":                  0,
  "KPV (Lysine-Proline-Valine)|10mg": 0,
  "PNC-27|10mg":                     0,

  // Cognitive
  "Selank|10mg":                     0,
  "Semax|10mg":                      0,
  "DSIP|15mg":                       0,
  "Pinealon|20mg":                   0,
  "Oxytocin|2mg":                    0,

  // Longevity
  "Epithalon|10mg":                  0,
  "MOTS-C|10mg":                     0,
  "MOTS-C|40mg":                     0,
  "SS-31|50mg":                      0,
  "FOX-04|10mg":                     0,
  "NAD+|500mg":                      0,
  "Glutathione|1500mg":              0,

  // Sexual Health
  "PT-141|10mg":                     0,
  "Kisspeptin-10|10mg":              0,

  // Blends
  "BPC Blend|70mg":                  0,
  "Wolverine Blend|20mg":            0,
  "KLOW|80mg":                       0,

  // Supplies
  "BAC Water|10ml":                  0,
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
