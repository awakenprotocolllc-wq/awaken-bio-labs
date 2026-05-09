"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const data = await res.json();
    if (data.ok) {
      router.push("/admin/orders");
      router.refresh();
    } else {
      setError("Incorrect password.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center px-4">
      <div className="bg-carbon border border-slate max-w-sm w-full p-8 sm:p-10">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        <p className="font-mono text-accent text-xs tracking-[0.25em] mb-2 text-center">
          — ADMIN ACCESS —
        </p>
        <h1 className="font-sans font-bold text-paper text-2xl mb-8 text-center">
          Orders Dashboard
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-bone text-xs tracking-wider uppercase mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-obsidian border border-slate text-paper px-4 h-11 font-sans text-sm focus:outline-none focus:border-accent transition-colors"
              autoFocus
            />
          </div>

          {error && (
            <p className="font-mono text-red-400 text-xs border border-red-400/30 bg-red-400/10 px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-obsidian font-semibold h-12 min-h-[44px] hover:bg-accent/80 transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
