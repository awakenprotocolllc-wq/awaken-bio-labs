import { kv } from "@vercel/kv";

/**
 * Increments a counter in KV and checks if it exceeds the limit.
 * Window resets after `windowSeconds` from the first request in the window.
 *
 * @returns allowed: false when the limit has been exceeded
 */
export async function rateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean }> {
  const key = `ratelimit:${identifier}`;
  const count = await kv.incr(key);
  if (count === 1) {
    // First hit in this window — set expiry
    await kv.expire(key, windowSeconds);
  }
  return { allowed: count <= limit };
}

/** Short-burst limit: 10 requests per 60 seconds per key. */
export async function rateLimitBurst(key: string): Promise<{ allowed: boolean }> {
  return rateLimit(`burst:${key}`, 10, 60);
}

/** Extracts the most-specific IP from the request headers. */
export function clientIp(req: Request | { headers: Headers }): string {
  const headers = req instanceof Request ? req.headers : req.headers;
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
