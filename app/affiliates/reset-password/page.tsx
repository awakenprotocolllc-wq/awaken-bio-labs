"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import SiteShell from "@/components/SiteShell";

type TokenStatus = "checking" | "valid" | "used" | "expired" | "invalid";

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";

  const [tokenStatus, setTokenStatus] = useState<TokenStatus>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Validate the token before showing the form — never make the user fill it out blind
  useEffect(() => {
    if (!token) { setTokenStatus("invalid"); return; }
    fetch(`/api/affiliate/reset-password?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => setTokenStatus(data.status ?? "invalid"))
      .catch(() => setTokenStatus("invalid"));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setSubmitStatus("loading");
    try {
      const res = await fetch("/api/affiliate/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!data.ok) {
        setErrorMsg(data.error ?? "Something went wrong.");
        setSubmitStatus("error");
      } else {
        setSubmitStatus("done");
        setTimeout(() => router.push("/affiliates/login"), 2500);
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setSubmitStatus("error");
    }
  }

  // ── Checking ──
  if (tokenStatus === "checking") {
    return (
      <div className="text-center py-12">
        <p className="font-mono text-bone text-sm">Verifying link…</p>
      </div>
    );
  }

  // ── Invalid / expired / used ──
  if (tokenStatus !== "valid") {
    const messages: Record<Exclude<TokenStatus, "checking" | "valid">, string> = {
      used: "This reset link has already been used.",
      expired: "This reset link has expired.",
      invalid: "This reset link is invalid.",
    };
    return (
      <div className="bg-carbon border border-slate p-6 sm:p-8 text-center space-y-5">
        <p className="font-mono text-sm text-red-400">
          {messages[tokenStatus as Exclude<TokenStatus, "checking" | "valid">]}
        </p>
        <p className="text-bone text-sm">
          {tokenStatus === "used"
            ? "If you need to change your password again, request a new link."
            : "Reset links expire after 15 minutes. Please request a new one."}
        </p>
        <Link
          href="/affiliates/login"
          className="inline-block font-mono text-xs text-accent hover:underline"
        >
          ← Back to login
        </Link>
      </div>
    );
  }

  // ── Success ──
  if (submitStatus === "done") {
    return (
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent flex items-center justify-center mx-auto">
          <span className="text-accent text-xl">✓</span>
        </div>
        <h2 className="font-sans font-bold text-paper text-2xl">Password updated.</h2>
        <p className="text-bone text-sm">Redirecting you to login…</p>
      </div>
    );
  }

  // ── Form (token is valid) ──
  return (
    <form onSubmit={handleSubmit} className="bg-carbon border border-slate p-6 sm:p-8 space-y-5">
      <div>
        <label className="block font-mono text-xs text-bone tracking-wider uppercase mb-2">
          New Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          placeholder="Min. 8 characters"
          className="w-full bg-obsidian border border-slate text-paper font-sans px-4 h-12 min-h-[44px] focus:border-accent focus:outline-none transition-colors placeholder:text-bone/40"
        />
      </div>

      <div>
        <label className="block font-mono text-xs text-bone tracking-wider uppercase mb-2">
          Confirm Password
        </label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          className="w-full bg-obsidian border border-slate text-paper font-sans px-4 h-12 min-h-[44px] focus:border-accent focus:outline-none transition-colors"
        />
      </div>

      {(errorMsg || submitStatus === "error") && (
        <p className="font-mono text-[11px] text-red-400 tracking-wide">
          {errorMsg ?? "Something went wrong."}
        </p>
      )}

      <button
        type="submit"
        disabled={submitStatus === "loading"}
        className="w-full bg-accent text-obsidian font-semibold h-12 min-h-[44px] hover:bg-accent/80 transition-colors disabled:opacity-50"
      >
        {submitStatus === "loading" ? "Updating…" : "Set New Password"}
      </button>

      <div className="text-center pt-2">
        <Link href="/affiliates/login" className="font-mono text-xs text-bone hover:text-accent transition-colors">
          ← Back to login
        </Link>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <SiteShell>
      <section className="bg-obsidian min-h-[80vh] flex items-center py-16">
        <div className="w-full max-w-md mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="font-mono text-accent text-xs tracking-[0.25em] mb-3">
              — AFFILIATE PORTAL —
            </p>
            <h1 className="font-sans font-bold text-paper text-4xl sm:text-5xl tracking-tight leading-[1]">
              Set new password.
            </h1>
            <p className="text-bone mt-3">Choose a new password for your account.</p>
          </div>

          <Suspense fallback={<div className="text-bone text-center font-mono text-sm">Loading…</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </section>
    </SiteShell>
  );
}
