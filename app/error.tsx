"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log digest only — Vercel correlates this with the full server-side error
    console.error("[client-error] digest:", error.digest ?? "(no digest)");
  }, [error]);

  return (
    <main className="min-h-screen bg-obsidian flex flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-[10px] text-accent tracking-[0.3em] uppercase mb-4">— Error —</p>
      <h1 className="font-sans font-bold text-paper text-4xl sm:text-5xl mb-4">Something went wrong.</h1>
      <p className="font-mono text-bone/60 text-sm max-w-sm mb-10">
        An unexpected error occurred. Please try again or contact{" "}
        <a href="mailto:support@awakenbiolabs.com" className="text-accent hover:underline">
          support@awakenbiolabs.com
        </a>{" "}
        if the problem persists.
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="border border-accent text-accent font-semibold font-mono text-xs tracking-wider px-8 h-11 inline-flex items-center hover:bg-accent/10 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="border border-slate text-bone/60 font-semibold font-mono text-xs tracking-wider px-8 h-11 inline-flex items-center hover:border-accent hover:text-accent transition-colors"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
