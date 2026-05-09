import Link from "next/link";
import SiteShell from "@/components/SiteShell";

export const metadata = {
  title: "Order Confirmed · Awaken Bio Labs",
};

export default function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: { id?: string };
}) {
  const orderId = searchParams.id?.toUpperCase() ?? "";

  return (
    <SiteShell>
      <section className="bg-obsidian min-h-[calc(100vh-200px)] flex items-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20 text-center">
          {/* Checkmark */}
          <div className="w-16 h-16 border-2 border-accent flex items-center justify-center mx-auto mb-8">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 13l4 4L19 7"
                stroke="#57C7D6"
                strokeWidth="2"
                strokeLinecap="square"
              />
            </svg>
          </div>

          <p className="font-mono text-accent text-xs tracking-[0.25em] mb-4">— ORDER RECEIVED —</p>

          <h1 className="font-sans font-bold text-paper text-4xl sm:text-5xl leading-[1] tracking-tight mb-6">
            You&apos;re all set.
          </h1>

          {orderId && (
            <p className="font-mono text-bone text-xs tracking-wider mb-6">
              Order <span className="text-accent">#{orderId}</span>
            </p>
          )}

          <div className="bg-carbon border border-accent/30 p-6 sm:p-8 text-left mb-10">
            <p className="font-mono text-accent text-[10px] tracking-[0.2em] mb-4">— NEXT STEPS —</p>
            <ol className="space-y-4">
              {[
                "Check your email for Zelle payment instructions.",
                "Send the exact order total to Zelle ID: awakenbiolabs (AWAKEN BIOLABS LLC).",
                "Reply to the email with a screenshot of your Zelle confirmation.",
                "Once we verify payment, your order ships — typically the same or next business day.",
              ].map((step, i) => (
                <li key={i} className="flex gap-4 items-start">
                  <span className="font-mono text-accent text-sm font-bold shrink-0 mt-0.5">
                    0{i + 1}
                  </span>
                  <span className="text-bone text-sm leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <p className="text-bone text-sm mb-8">
            Questions?{" "}
            <a
              href="mailto:support@awakenbiolabs.com"
              className="text-accent hover:underline"
            >
              support@awakenbiolabs.com
            </a>
          </p>

          <Link
            href="/shop"
            className="inline-flex items-center border border-accent text-accent font-semibold px-8 h-12 min-h-[44px] hover:bg-accent/10 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
