"use client";

import { useState } from "react";
import Link from "next/link";

// Shown on a product page when the product is out of stock.
// Signed-in customers subscribe in one click; signed-out visitors are
// directed to sign in / create an account (401 from the API).
export default function RestockNotify({ slug, productName }: { slug: string; productName: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "subscribed" | "needsAuth" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleNotify() {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/stock/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (res.status === 401) {
        setStatus("needsAuth");
        return;
      }
      const data = await res.json();
      if (data.ok) {
        setStatus("subscribed");
      } else {
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  if (status === "subscribed") {
    return (
      <div className="bg-carbon border border-accent/40 px-5 py-4">
        <p className="font-mono text-accent text-xs tracking-wider">
          ✓ You&apos;re on the list — we&apos;ll email you when {productName} is back in stock.
        </p>
      </div>
    );
  }

  if (status === "needsAuth") {
    const next = encodeURIComponent(`/shop/${slug}`);
    return (
      <div className="bg-carbon border border-slate px-5 py-4">
        <p className="text-bone text-sm mb-3">
          Sign in to get notified when this product is back in stock.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/account/login?next=${next}`}
            className="font-mono text-xs tracking-wider uppercase bg-accent text-obsidian font-bold px-4 h-10 inline-flex items-center hover:bg-accent/80 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href={`/account/signup?next=${next}`}
            className="font-mono text-xs tracking-wider uppercase border border-accent text-accent px-4 h-10 inline-flex items-center hover:bg-accent/10 transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleNotify}
        disabled={status === "loading"}
        className="w-full sm:w-auto border border-accent text-accent font-semibold h-12 min-h-[44px] px-8 flex items-center justify-center gap-2 hover:bg-accent/10 transition-colors disabled:opacity-50"
      >
        {status === "loading" ? "Adding you…" : "🔔 Notify Me When Back in Stock"}
      </button>
      {status === "error" && errorMsg && (
        <p className="font-mono text-red-400 text-[10px] tracking-wider mt-2">✗ {errorMsg}</p>
      )}
    </div>
  );
}
