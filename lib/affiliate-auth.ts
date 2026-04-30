"use client";

// =============================================================================
// DEMO AUTH — REPLACE BEFORE PRODUCTION
// =============================================================================
// This is a localStorage-based "demo" auth for processor approval review.
// Any email + password (>= 6 chars) creates a session. Real auth + a database
// must be wired before launching commercially.
//
// Recommended swap:
//   - Auth: NextAuth.js, Supabase Auth, or Clerk
//   - DB: Supabase (Postgres), PlanetScale, or Neon
//   - Affiliate engine: Tapfiliate / Rewardful, OR a custom table that tracks
//     clicks, conversions, payouts per affiliate_id.
//
// All UI components reference this module — replace the FUNCTIONS, keep the
// SHAPES (AffiliateUser type), and the dashboard keeps working.
// =============================================================================

const KEY = "awaken_affiliate_session";

export type AffiliateUser = {
  id: string;
  name: string;
  email: string;
  affiliateCode: string; // their unique discount/tracking code
  status: "approved" | "pending";
  joinedAt: string; // ISO date
};

export function login(email: string, password: string): AffiliateUser | null {
  if (!email.includes("@") || password.length < 6) return null;
  const namePart = email.split("@")[0];
  const code =
    namePart.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 8) || "PARTNER";
  const user: AffiliateUser = {
    id: `aff_${Date.now()}`,
    name: namePart
      .split(/[._-]/)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" "),
    email,
    affiliateCode: code,
    status: "approved",
    joinedAt: new Date().toISOString(),
  };
  localStorage.setItem(KEY, JSON.stringify(user));
  return user;
}

export function logout() {
  localStorage.removeItem(KEY);
}

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
