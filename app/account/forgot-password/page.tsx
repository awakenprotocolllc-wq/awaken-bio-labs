"use client";

import { useState } from "react";
import Link from "next/link";
import SiteShell from "@/components/SiteShell";

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]     = useState(false);
  const [error, setError]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await fetch("/api/customer/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteShell>
      <section className="min-h-[calc(100vh-200px)] bg-obsidian flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md">
          <p className="font-mono text-accent text-xs tracking-[0.25em] mb-4">— ACCOUNT RECOVERY —</p>

          {sent ? (
            <>
              <h1 className="font-sans font-bold text-paper text-3xl mb-4">Check your email</h1>
              <p className="font-sans text-bone text-sm leading-relaxed mb-8">
                If an account exists for <strong className="text-paper">{email}</strong>, you&apos;ll receive a password
                reset link within a few minutes.
              </p>
              <Link href="/account/login" className="font-mono text-accent text-sm hover:underline">
                ← Back to sign in
              </Link>
            </>
          ) : (
            <>
              <h1 className="font-sans font-bold text-paper text-3xl mb-2">Forgot password?</h1>
              <p className="font-sans text-bone text-sm mb-8">
                Enter your email and we&apos;ll send a reset link if an account exists.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block font-mono text-bone text-xs tracking-wider uppercase mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full bg-carbon border border-slate text-paper font-sans text-sm px-4 h-11 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                {error && (
                  <p className="font-mono text-red-400 text-sm border border-red-400/30 bg-red-400/10 px-4 py-3">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-accent text-obsidian font-semibold h-12 hover:bg-accent/80 transition-colors disabled:opacity-50"
                >
                  {loading ? "Sending…" : "Send Reset Link"}
                </button>
              </form>

              <p className="font-mono text-bone/50 text-xs text-center mt-8">
                <Link href="/account/login" className="text-accent hover:underline">← Back to sign in</Link>
              </p>
            </>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
