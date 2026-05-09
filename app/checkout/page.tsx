import { Suspense } from "react";
import SiteShell from "@/components/SiteShell";
import CheckoutForm from "./CheckoutForm";

export const metadata = {
  title: "Checkout · Awaken Bio Labs",
  description: "Place your research compound order securely.",
};

export default function CheckoutPage() {
  return (
    <SiteShell>
      <section className="bg-obsidian border-b border-slate">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-14">
          <p className="font-mono text-accent text-xs tracking-[0.25em] mb-4">— CHECKOUT —</p>
          <h1 className="font-sans font-bold text-paper text-4xl sm:text-5xl leading-[1] tracking-tight mb-3">
            Place Your Order.
          </h1>
          <p className="text-bone text-sm sm:text-base max-w-xl leading-relaxed">
            Fill in your details below. You&apos;ll receive payment instructions via email — we accept
            Zelle only. Your order ships once payment is confirmed.
          </p>
        </div>
      </section>

      <section className="bg-obsidian py-12 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* Suspense required by Next.js for useSearchParams() */}
          <Suspense fallback={<div className="text-bone font-mono text-sm animate-pulse">Loading…</div>}>
            <CheckoutForm />
          </Suspense>
        </div>
      </section>
    </SiteShell>
  );
}
