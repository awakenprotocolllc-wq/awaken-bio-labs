"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import { login } from "@/lib/affiliate-auth";

export default function AffiliateLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

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

  return (
    <SiteShell>
      <section className="bg-obsidian min-h-[80vh] flex items-center py-16">
        <div className="w-full max-w-md mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="font-mono text-accent text-xs tracking-[0.25em] mb-3">
              — AFFILIATE PORTAL —
            </p>
            <h1 className="font-sans font-bold text-paper text-4xl sm:text-5xl tracking-tight leading-[1]">
              Welcome back.
            </h1>
            <p className="text-bone mt-3">Sign in to your affiliate dashboard.</p>
          </div>

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
              <a href="#" className="text-bone hover:text-accent transition-colors">
                Forgot password?
              </a>
              <Link href="/affiliates" className="text-accent hover:underline">
                Apply →
              </Link>
            </div>
          </form>

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
