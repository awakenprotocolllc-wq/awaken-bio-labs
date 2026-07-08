import { kv } from "@vercel/kv";

// ---------------------------------------------------------------------------
// Stock state — product catalog lives in lib/products.ts (static file), so
// runtime out-of-stock flags live in KV, keyed by product slug.
//
// Keys:
//   stock:out            — KV set of product slugs currently out of stock
//   stock:notify:<slug>  — KV set of customerIds waiting for a restock email
// ---------------------------------------------------------------------------

const OUT_KEY = "stock:out";

// Reads are fail-safe: if KV is unreachable (e.g. local builds without KV env
// vars), everything reports in-stock rather than breaking the storefront.
export async function getOutOfStockSlugs(): Promise<string[]> {
  try {
    return ((await kv.smembers(OUT_KEY)) as string[]) ?? [];
  } catch {
    return [];
  }
}

export async function isOutOfStock(slug: string): Promise<boolean> {
  try {
    return (await kv.sismember(OUT_KEY, slug)) === 1;
  } catch {
    return false;
  }
}

export async function setOutOfStock(slug: string, out: boolean): Promise<void> {
  if (out) {
    await kv.sadd(OUT_KEY, slug);
  } else {
    await kv.srem(OUT_KEY, slug);
  }
}

// ── Restock notification subscriptions ──────────────────────────────────────

export async function addRestockSubscriber(slug: string, customerId: string): Promise<void> {
  await kv.sadd(`stock:notify:${slug}`, customerId);
}

export async function hasRestockSubscription(slug: string, customerId: string): Promise<boolean> {
  return (await kv.sismember(`stock:notify:${slug}`, customerId)) === 1;
}

export async function getRestockSubscriberCount(slug: string): Promise<number> {
  return (await kv.scard(`stock:notify:${slug}`)) ?? 0;
}

/** Returns all subscriber customerIds and clears the list (called on restock). */
export async function popRestockSubscribers(slug: string): Promise<string[]> {
  const ids = ((await kv.smembers(`stock:notify:${slug}`)) as string[]) ?? [];
  if (ids.length) await kv.del(`stock:notify:${slug}`);
  return ids;
}
