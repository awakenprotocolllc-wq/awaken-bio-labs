"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import SuccessTransition from "@/components/SuccessTransition";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";

  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState(false);

  const handleComplete = useCallback(() => router.push("/account/login"), [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/customer/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error ?? "Reset failed."); setLoading(false); return; }
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <SiteShell>
        <section className="min-h-[calc(100vh-200px)] bg-obsidian flex items-center justify-center px-4 py-20">
          <div className="text-center">
            <p className="font-mono text-red-400 text-xs tracking-[0.25em] mb-4">— INVALID LINK —</p>
            <p className="font-sans text-bone text-sm mb-6">This reset link is missing or invalid.</p>
            <Link href="/account/forgot-password" className="font-mono text-accent text-sm hover:underline">
              Request a new link →
            </Link>
          </div>
        </section>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <section className="min-h-[calc(100vh-200px)] bg-obsidian flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md">
          <p className="font-mono text-accent text-xs tracking-[0.25em] mb-4">— SET NEW PASSWORD —</p>
          <h1 className="font-sans font-bold text-paper text-3xl mb-8">Choose a new password</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block font-mono text-bone text-xs tracking-wider uppercase mb-2">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full bg-carbon border border-slate text-paper font-sans text-sm px-4 h-11 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="block font-mono text-bone text-xs tracking-wider uppercase mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
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
              disabled={loading}
              className="w-full bg-accent text-obsidian font-semibold h-12 hover:bg-accent/80 transition-colors disabled:opacity-50"
            >
              {loading ? "Updating…" : "Update Password"}
            </button>
          </form>
        </div>
      </section>

      {success && <SuccessTransition label="Password updated" onComplete={handleComplete} />}
    </SiteShell>
  );
}
