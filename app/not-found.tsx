"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-obsidian flex flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-[10px] text-accent tracking-[0.3em] uppercase mb-4">— 404 —</p>
      <h1 className="font-sans font-bold text-paper text-4xl sm:text-5xl mb-4">Page not found.</h1>
      <p className="font-mono text-bone/60 text-sm max-w-sm mb-10">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="border border-accent text-accent font-semibold font-mono text-xs tracking-wider px-8 h-11 inline-flex items-center hover:bg-accent/10 transition-colors"
      >
        Back to home →
      </Link>
    </main>
  );
}
