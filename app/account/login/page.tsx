"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import SuccessTransition from "@/components/SuccessTransition";

export default function CustomerLoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const rawNext = params.get("next") ?? "";
  // Allow only same-origin relative paths; reject absolute URLs and protocol-relative redirects
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/account";

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);

  const handleComplete = useCallback(() => router.push(next), [router, next]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Email and password are required."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error ?? "Login failed."); setLoading(false); return; }
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
          <h1 className="font-sans font-bold text-paper text-3xl mb-8">Sign in</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
            <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 accent-accent"
                />
                <span className="font-mono text-bone text-xs tracking-wider">Remember me (30 days)</span>
              </label>
              <Link href="/account/forgot-password" className="font-mono text-accent text-xs hover:underline">
                Forgot password?
              </Link>
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
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="font-mono text-bone/50 text-xs text-center mt-8">
            No account?{" "}
            <Link href={`/account/signup?next=${encodeURIComponent(next)}`} className="text-accent hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </section>

      {success && <SuccessTransition label="Welcome back" onComplete={handleComplete} />}
    </SiteShell>
  );
}

function Field({ label, type, value, onChange, autoComplete }: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; autoComplete?: string;
}) {
  return (
    <div>
      <label className="block font-mono text-bone text-xs tracking-wider uppercase mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required
        className="w-full bg-carbon border border-slate text-paper font-sans text-sm px-4 h-11 focus:outline-none focus:border-accent transition-colors"
      />
    </div>
  );
}
