"use client";

// ---------------------------------------------------------------------------
// Real affiliate auth — backed by Vercel KV + httpOnly cookie session.
// Client code still reads from localStorage for the dashboard shell;
// the httpOnly cookie is what middleware and API routes actually trust.
// ---------------------------------------------------------------------------

const KEY = "awaken_affiliate_user";

export type AffiliateUser = {
  id: string;
  name: string;
  email: string;
  affiliateCode: string;
  status: "active" | "suspended";
  commissionRate: number;
  joinedAt: string;
};

/** POST to the real login API, then cache the user in localStorage. */
export async function login(email: string, password: string): Promise<AffiliateUser | null> {
  try {
    const res = await fetch("/api/affiliate/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!data.ok || !data.user) return null;
    // Cache in localStorage so dashboard client components can read synchronously
    localStorage.setItem(KEY, JSON.stringify(data.user));
    return data.user as AffiliateUser;
  } catch {
    return null;
  }
}

/** Clear the httpOnly cookie via API + remove localStorage cache. */
export async function logout(): Promise<void> {
  try {
    await fetch("/api/affiliate/logout", { method: "POST" });
  } catch { /* best-effort */ }
  localStorage.removeItem(KEY);
}

/**
 * Read the cached user from localStorage.
 * Dashboard components call this on mount; middleware enforces the real session.
 */
export function getCurrentUser(): AffiliateUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AffiliateUser;
  } catch {
    return null;
  }
}

/** Refresh localStorage from the server session (call after page load). */
export async function refreshUser(): Promise<AffiliateUser | null> {
  try {
    const res = await fetch("/api/affiliate/me");
    if (!res.ok) {
      localStorage.removeItem(KEY);
      return null;
    }
    const data = await res.json();
    if (!data.ok || !data.user) {
      localStorage.removeItem(KEY);
      return null;
    }
    localStorage.setItem(KEY, JSON.stringify(data.user));
    return data.user as AffiliateUser;
  } catch {
    return null;
  }
}
