"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import { login } from "@/lib/affiliate-auth";

export default function AffiliateLoginPage() {
  const router = useRouter();

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStatus, setForgotStatus] = useState<"idle" | "loading" | "sent">("idle");
  const [forgotError, setForgotError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const user = await login(email.trim(), password);
    if (!user) {
      setError("Invalid email or password.");
      return;
    }
    router.push("/affiliates/dashboard");
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setForgotError(null);
    setForgotStatus("loading");
    try {
      await fetch("/api/affiliate/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      // Always show "sent" — never leak whether email exists
      setForgotStatus("sent");
    } catch {
      setForgotError("Network error. Please try again.");
      setForgotStatus("idle");
    }
  }

  return (
    <SiteShell>
      <section className="bg-obsidian min-h-[80vh] flex items-center py-16">
        <div className="w-full max-w-md mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="font-mono text-accent text-xs tracking-[0.25em] mb-3">
              — AFFILIATE PORTAL —
            </p>
            {showForgot ? (
              <>
                <h1 className="font-sans font-bold text-paper text-4xl sm:text-5xl tracking-tight leading-[1]">
                  Reset password.
                </h1>
                <p className="text-bone mt-3">
                  Enter your email and we&apos;ll send a reset link.
                </p>
              </>
            ) : (
              <>
                <h1 className="font-sans font-bold text-paper text-4xl sm:text-5xl tracking-tight leading-[1]">
                  Welcome back.
                </h1>
                <p className="text-bone mt-3">Sign in to your affiliate dashboard.</p>
              </>
            )}
          </div>

          {/* ── Forgot password panel ── */}
          {showForgot ? (
            <div className="bg-carbon border border-slate p-6 sm:p-8 space-y-5">
              {forgotStatus === "sent" ? (
                <div className="text-center space-y-4 py-4">
                  <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent flex items-center justify-center mx-auto">
                    <span className="text-accent text-xl">✓</span>
                  </div>
                  <p className="text-paper font-sans font-semibold text-lg">Check your email.</p>
                  <p className="text-bone text-sm leading-relaxed">
                    If that address is registered, we&apos;ve sent a reset link. It expires in 15 minutes.
                  </p>
                  <button
                    onClick={() => { setShowForgot(false); setForgotStatus("idle"); setForgotEmail(""); }}
                    className="font-mono text-xs text-accent hover:underline"
                  >
                    ← Back to login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgot} className="space-y-5">
                  <div>
                    <label className="block font-mono text-xs text-bone tracking-wider uppercase mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      className="w-full bg-obsidian border border-slate text-paper font-sans px-4 h-12 min-h-[44px] focus:border-accent focus:outline-none transition-colors"
                    />
                  </div>

                  {forgotError && (
                    <p className="font-mono text-[11px] text-red-400 tracking-wide">{forgotError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={forgotStatus === "loading"}
                    className="w-full bg-accent text-obsidian font-semibold h-12 min-h-[44px] hover:bg-accent/80 transition-colors disabled:opacity-50"
                  >
                    {forgotStatus === "loading" ? "Sending…" : "Send Reset Link"}
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => { setShowForgot(false); setForgotError(null); }}
                      className="font-mono text-xs text-bone hover:text-accent transition-colors"
                    >
                      ← Back to login
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* ── Login panel ── */
            <form
              onSubmit={handleSubmit}
              className="bg-carbon border border-slate p-6 sm:p-8 space-y-5"
            >
              <div>
                <label className="block font-mono text-xs text-bone tracking-wider uppercase mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-obsidian border border-slate text-paper font-sans px-4 h-12 min-h-[44px] focus:border-accent focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block font-mono text-xs text-bone tracking-wider uppercase mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-obsidian border border-slate text-paper font-sans px-4 h-12 min-h-[44px] focus:border-accent focus:outline-none transition-colors"
                />
              </div>

              {error && (
                <p className="font-mono text-[11px] text-red-400 tracking-wide">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="w-full bg-accent text-obsidian font-semibold h-12 min-h-[44px] hover:bg-accent/80 transition-colors"
              >
                Sign In
              </button>

              <div className="flex items-center justify-between text-xs font-mono pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForgot(true); setForgotEmail(email); setError(null); }}
                  className="text-bone hover:text-accent transition-colors"
                >
                  Forgot password?
                </button>
                <Link href="/affiliates" className="text-accent hover:underline">
                  Apply →
                </Link>
              </div>
            </form>
          )}

          <p className="font-mono text-[10px] text-bone tracking-wide text-center mt-6 leading-relaxed">
            Not an affiliate yet?{" "}
            <Link href="/affiliates" className="text-accent hover:underline">
              Apply for the partner program
            </Link>
            .
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
