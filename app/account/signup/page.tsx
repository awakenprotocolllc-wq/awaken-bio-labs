"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import SuccessTransition from "@/components/SuccessTransition";

function passwordStrength(p: string): { score: number; label: string; color: string } {
  if (p.length === 0) return { score: 0, label: "", color: "" };
  let score = 0;
  if (p.length >= 8)  score++;
  if (p.length >= 12) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;

  if (score <= 1) return { score, label: "Weak",   color: "bg-red-400" };
  if (score <= 2) return { score, label: "Fair",   color: "bg-yellow-400" };
  if (score <= 3) return { score, label: "Good",   color: "bg-blue-400" };
  return              { score, label: "Strong", color: "bg-green-400" };
}

export default function CustomerSignupPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/account";

  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);

  const strength = passwordStrength(password);
  const handleComplete = useCallback(() => router.push(next), [router, next]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name || !email || !password) { setError("All fields are required."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/customer/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error ?? "Signup failed."); setLoading(false); return; }
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <SiteShell>
      <section className="min-h-[calc(100vh-200px)] bg-obsidian flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md">
          <p className="font-mono text-accent text-xs tracking-[0.25em] mb-4">— YOUR ACCOUNT —</p>
          <h1 className="font-sans font-bold text-paper text-3xl mb-2">Create account</h1>
          <p className="font-sans text-bone text-sm mb-8">Required to place an order. Takes 30 seconds.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block font-mono text-bone text-xs tracking-wider uppercase mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
                className="w-full bg-carbon border border-slate text-paper font-sans text-sm px-4 h-11 focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div>
              <label className="block font-mono text-bone text-xs tracking-wider uppercase mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="w-full bg-carbon border border-slate text-paper font-sans text-sm px-4 h-11 focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div>
              <label className="block font-mono text-bone text-xs tracking-wider uppercase mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
                className="w-full bg-carbon border border-slate text-paper font-sans text-sm px-4 h-11 focus:outline-none focus:border-accent transition-colors"
              />
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1 h-0.5">
                    {[1,2,3,4].map((i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-full transition-all duration-200 ${
                          strength.score >= i ? strength.color : "bg-slate"
                        }`}
                      />
                    ))}
                  </div>
                  {strength.label && (
                    <p className="font-mono text-[10px] text-bone/50 tracking-wider">{strength.label}</p>
                  )}
                </div>
              )}
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
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className="font-mono text-bone/40 text-[10px] text-center mt-6 leading-relaxed">
            By creating an account you agree to our{" "}
            <Link href="/terms" className="text-bone/60 hover:underline">Terms</Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-bone/60 hover:underline">Privacy Policy</Link>.
          </p>

          <p className="font-mono text-bone/50 text-xs text-center mt-6">
            Already have an account?{" "}
            <Link href={`/account/login?next=${encodeURIComponent(next)}`} className="text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </section>

      {success && <SuccessTransition label="Account created" onComplete={handleComplete} />}
    </SiteShell>
  );
}
